/* taken from https://stackoverflow.com/a/42389266 (CC BY-SA 4.0) */
export default {
  beforeMount: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      /* Ensure the target is still part of the DOM. When using v-if it might
       * have been removed already and we cannot reasonably decide the second
       * condition, which is that the target must not be this element or one of
       * its children */
      if (document.contains(event.target) && !(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        binding.value ();
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted: function (el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
};
/* end copy */
