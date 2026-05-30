import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  // Drop the password hash before returning a user to the caller.
  private stripPassword<T>(user: T): T {
    delete (user as { password?: string }).password;
    return user;
  }

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Reject a duplicate username or email up front.
    const existingUser = await this.userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      throw new BadRequestException('Username or email already exists');
    }

    // The pre-save hook in user.schema.ts hashes the password.
    const newUser = new this.userModel({ username, email, password });
    await newUser.save();

    // Return the user without the password.
    const result = newUser.toObject();
    return this.stripPassword(result);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Find the user.
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Verify the password.
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Issue the token.
    const token = this.jwtService.sign({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
    });

    // 4. Return the token and user info (without the password).
    const userInfo = user.toObject();

    return { token, user: this.stripPassword(userInfo) };
  }

  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.stripPassword(user);
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    // If the email is changing, make sure it is not already taken.
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: userId },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    const user = await this.userModel.findByIdAndUpdate(userId, updateUserDto, {
      new: true,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.stripPassword(user);
  }
}
