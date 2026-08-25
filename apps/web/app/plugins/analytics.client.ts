export default defineNuxtPlugin(() => {
	const head = useHead({
		script: [
			// 51.LA
			{
				innerHTML: `
          !function(p){"use strict";!function(t){var s=window,e=document,i=p,c="".concat("https:"===e.location.protocol?"https://":"http://","sdk.51.la/js-sdk-pro.min.js"),n=e.createElement("script"),r=e.getElementsByTagName("script")[0];n.type="text/javascript",n.setAttribute("charset","UTF-8"),n.async=!0,n.src=c,n.id="LA_COLLECT",i.d=n;var o=function(){s.LA.ids.push(i)};s.LA?s.LA.ids&&o():(s.LA=p,s.LA.ids=[],o()),r.parentNode.insertBefore(n,r)}()}({id:"3OH4WPcpfNyYMNK5",ck:"3OH4WPcpfNyYMNK5",autoTrack:true,screenRecord:true});
        `,
				tagPosition: 'bodyClose'
			},
			// 51.LA LingQue 性能监控
			{
				innerHTML: `
          !(function(c,i,e,b){
            var h=i.createElement("script");
            var f=i.getElementsByTagName("script")[0];
            h.type="text/javascript";
            h.crossorigin=true;
            h.onload=function(){new c[b]["Monitor"]().init({id:"3OBm0toc2GDud3Vp"});};
            f.parentNode.insertBefore(h,f);h.src=e;
          })(window,document,"https://sdk.51.la/perf/js-sdk-perf.min.js","LingQue");
        `,
				tagPosition: 'bodyClose'
			}
		]
	})
})
