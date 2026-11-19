import ASScroll from '@ashthornton/asscroll'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from '../vendor/CustomEase'
import { Draggable } from '../vendor/Draggable'
import { InertiaPlugin } from '../vendor/InertiaPlugin'
gsap.registerPlugin(CustomEase, Draggable, InertiaPlugin, ScrollTrigger);
gsap.ticker.fps(60);

const asscrollContainerEl = document.querySelector('.asscroll-container');
const asscrollScrollEl = document.querySelector('.asscroll');

const ua = navigator.userAgent.toLowerCase()
const ios = ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")
const pinType = ios ? 'fixed' : 'transform';

const asscroll = new ASScroll({
  containerElement: asscrollContainerEl,
  touchScrollType: 'scrollTop',
  scrollElements: asscrollScrollEl,
  ease: 0.09,
  customScrollbar: false,
});

const EASING = {
  transform: CustomEase.create('transform', 'M0,0 C0.44,0.05 0.17,1 1,1'),
  transformReverse: CustomEase.create('transformReverse', 'M0,0 C0,0.852 0.87,0.542 1,1'),
  colorAndOpacity: CustomEase.create('colorAndOpacity', 'M0,0 C0.26,0.16 0.1,1 1,1 '),
}

const fixSection = (trigger, deveice, height) => {
  return gsap.to(trigger, {
    ease: 'none',
    scrollTrigger: {
      pin: true,
      pinType: pinType,
      trigger: trigger,
      start: 'start end',
      end: () => `+=${height - window.innerHeight}px`,
      scrub: true,
      invalidateOnRefresh: true,
    },
  })
}

/**
 * タッチ端末のネイティブスクロール時は、JSのpinではなくCSSのposition: stickyでセクションを固定する
 * pinはスクロールイベント→JSでtransform/fixedを切り替えるため、モバイルの慣性スクロールと1フレームずれてガタつく
 * stickyはブラウザのコンポジタ側で固定されるのでズレない
 * - マウス/トラックパッドがつながっている端末はASScrollがスムーススクロールに切り替わるため対象外
 * - overflow: clip 非対応ブラウザは祖先のoverflow: hiddenでstickyが効かないため従来のpinを使う
 */
const canUseStickyPin = () => {
  return (
    asscroll.controller.nativeScroll &&
    !window.matchMedia('(any-pointer: fine)').matches &&
    window.CSS && CSS.supports('overflow', 'clip')
  )
}

ScrollTrigger.defaults({
  scroller: asscroll.containerElement
})
ScrollTrigger.scrollerProxy(asscroll.containerElement, {
  scrollTop(value) {
    if (arguments.length) {
      asscroll.currentPos = value;
      return;
    }
    return asscroll.currentPos;
  },
  getBoundingClientRect() {
    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
  },
});

ScrollTrigger.addEventListener("refresh", asscroll.resize);

/**
 * モバイルはスクロールのたびにアドレスバーが出入りして画面の高さが変わる
 * ScrollTriggerは標準でresizeのたびに全体をrefreshするため、そのたびにアニメーションの位置が飛んでガタつく
 * タッチ端末のネイティブスクロール時は高さだけの変化ではrefreshせず、幅が変わった時(画面の回転など)だけrefreshする
 */
if (asscroll.controller.nativeScroll) {
  ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' });

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    ScrollTrigger.refresh();
  });
}

export default (context, inject) => {
  inject('asscroll', asscroll);
  inject('gsap', gsap);
  inject('ScrollTrigger', ScrollTrigger);
  inject('Draggable', Draggable);
  inject('EASING', EASING);
  inject('fixSection', fixSection);
  inject('canUseStickyPin', canUseStickyPin);
}
