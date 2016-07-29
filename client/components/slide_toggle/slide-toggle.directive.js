module.exports = ['$timeout', '$window', function($timeout, $window) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var initialState = $attr.initialState;
      var el = $element[0].querySelector('.slide-wrapper');
      el.style.overflowY = 'hidden';
      el.style.transition = 'max-height 0.25s ease-in-out';
      el.style.display = 'block';

      if (initialState === 'closed') { el.style.display = 'none'; }

      $scope.$watch($attr.slideToggle, function() {
        if (initialState === 'open') {
          $timeout(function() {
            var el_max_height = getHeight(el) + 'px';
            el.setAttribute('data-max-height', el_max_height);
            el.style.maxHeight = el_max_height;
            initialState = '';
          });
        }
        else if (initialState === 'closed') {
          $timeout(function() {
            var el_max_height = getHeight(el) + 'px';
            el.setAttribute('data-max-height', el_max_height);
            el.style.maxHeight = '0';
            el.style.display = 'block';
            initialState = '';
          });
        }
        else { toggleSlide(el); }
      });

      function getHeight(el) {
        var el_style      = $window.getComputedStyle(el),
            el_display    = el_style.display,
            el_position   = el_style.position,
            el_visibility = el_style.visibility,
            el_max_height = el_style.maxHeight.replace('px', '').replace('%', ''),
            wanted_height = 0;

        // if its not hidden we just return normal height
        if(el_display !== 'none' && el_max_height !== '0') {
          return el_style.height.replace('px', '').replace('%', '');
        }

        // the element is hidden so:
        // making the el block so we can meassure its height but still be hidden
        el.style.position   = 'absolute';
        el.style.visibility = 'hidden';
        el.style.display    = 'block';

        wanted_height     = el.offsetHeight;

        // reverting to the original values
        el.style.display    = el_display;
        el.style.position   = el_position;
        el.style.visibility = el_visibility;

        return wanted_height;
      }

      function toggleSlide(el) {
        // we've already used this before, so everything is setup
        if(el.style.maxHeight.replace('px', '').replace('%', '') === '0') {
          el.style.maxHeight = el.getAttribute('data-max-height');
        }
        else { el.style.maxHeight = '0'; }
      }
    }
  };
}];
