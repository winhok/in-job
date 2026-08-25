declare module 'virtual:svg-icons-register'

interface Window {
  SpeechRecognition?: new () => any
  webkitSpeechRecognition?: new () => any
  runSpeechOptimizerExamples?: () => void
}
