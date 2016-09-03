module.exports = ['$timeout', '$filter', '$compile', function($timeout, $filter, $compile) {
  return {
    scope: {
      postProcessing: '=',
      styleFix: '='
    },
    restrict: 'A',
    link: function($scope, $element) {
      // Auto Date Regex
      var autoDateRegex = /(ept-date=[0-9]+)/ig;
      var autoDate = function(timeString) {
        timeString = timeString.replace('ept-date=', '');
        var dateNumber = Number(timeString) || 0;
        var date = new Date(dateNumber);

        var now = new Date();
        var isToday = now.toDateString() === date.toDateString();
        var isThisYear = now.getYear() === date.getYear();
        if (isToday) {
          date = 'Today at ' +  $filter('date')(date, 'h:mm:ss a');
        }
        else if (isThisYear) {
          date = $filter('date')(date, 'MMMM d, h:mm:ss a');
        }
        else {
          date = $filter('date')(date, 'MMM d, y, h:mm:ss a');
        }
        return date;
      };

      // Auto Link Regex
      var autoLinkRegex = /(?:https?\:\/\/|www\.)+(?![^\s]*?")([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/ig;
      var autoLink = function(url) {
        var wrap = document.createElement('div');
        var anch = document.createElement('a');
        anch.href = url;
        anch.target = "_blank";
        anch.innerHTML = url;
        wrap.appendChild(anch);
        return wrap.innerHTML;
      };

      // Auto video embed Regex
      var autoVideoRegex = /((http(s)?:\/\/)?)(www\.)?((youtube\.com\/)|(youtu.be\/))([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
      var autoVideo = function(url) {
        var key = '';
        var temp = new URL(url);

        // parse url for youtube key
        if (url.indexOf('youtube') > 0) { key = temp.searchParams.get('v'); }
        else { key = temp.pathname.replace('/', ''); }

        // create youtube iframe
        var wrap = document.createElement('div');
        var frame = document.createElement('iframe');
        frame.width = 600;
        frame.height = 480;
        frame.src = 'https://www.youtube.com/embed/' + key;
        frame.setAttribute('frameborder', 0);
        frame.setAttribute('allowfullscreen', '');
        wrap.appendChild(frame);

        // return content
        if (key) { return wrap.innerHTML; }
        else { return url; }
      };

      // Style Fix Regex
      var styleFixRegex = /(class="bbcode-\S*")/ig;
      var styleFix = function(styleString) {
        // remove bbcode-prefix
        var classString = styleString.replace('class="bbcode-', '');
        classString = classString.replace('"', '');

        if (classString.indexOf('color-_') === 0) {
          var colorCode = classString.replace('color-_', '');
          return 'ng-style="{ \'color\': \'#' + colorCode + '\' }"';
        }
        else if (classString.indexOf('color') === 0) {
          var color = classString.replace('color-', '');
          return 'ng-style="{ \'color\': \'' + color + '\' }"';
        }
        else if (classString.indexOf('bgcolor-_') === 0) {
          var bgColorCode = classString.replace('bgcolor-_', '');
          return 'ng-style="{ \'background-color\': \'#' + bgColorCode + '\' }"';
        }
        else if (classString.indexOf('bgcolor') === 0) {
          var bgColor = classString.replace('bgcolor-', '');
          return 'ng-style="{ \'background-color\': \'' + bgColor + '\' }"';
        }
        else if (classString.indexOf('text') === 0) {
          var dir = classString.replace('text-', '');
          return 'ng-style="{ \'text-align\': \'' + dir + '\' }"';
        }
        else if (classString.indexOf('list') === 0) {
          var type = classString.replace('list-', '');
          return 'ng-style="{ \'list-style-type\': \'' + type + '\' }"';
        }
        else if (classString.indexOf('shadow-_') === 0) {
          var shadowCode = classString.replace('shadow-_', '');
          shadowCode = shadowCode.replace(/_/gi, ' ');
          shadowCode = '#' + shadowCode;
          return 'ng-style="{ \'text-shadow\': \'' + shadowCode + '\' }"';
        }
        else if (classString.indexOf('shadow') === 0) {
          var shadow = classString.replace('shadow-', '');
          shadow = shadow.replace(/_/gi, ' ');
          return 'ng-style="{ \'text-shadow\': \'' + shadow + '\' }"';
        }
        else if (classString.indexOf('size') === 0) {
          var size = classString.replace('size-', '');
          return 'ng-style="{ \'font-size\': \'' + size + '\' }"';
        }
        else return styleString;
      };

      var process = function() {
        var postBody = $scope.postProcessing;
        var processed = postBody || '';
        var doStyleFix = $scope.styleFix;

        // autoDate and autoLink
        processed = processed.replace(autoDateRegex, autoDate) || processed;
        processed = processed.replace(autoVideoRegex, autoVideo) || processed;
        processed = processed.replace(autoLinkRegex, autoLink) || processed;

        // styleFix
        if (doStyleFix) {
          processed = processed.replace(styleFixRegex, styleFix) || processed;
        }

        // dump html into element
        $element.html(processed);

        // image loading
        var images = $($element[0]).find('img');
        images.each(function(index, image) {
          $(image).addClass('image-loader');
        });

        // noopener/noreferrer hack
        $("a[target='_blank']").attr('rel', 'noopener noreferrer');

        // compile directives
        $compile($element.contents())($scope);
      };

      $scope.$watch('postProcessing',
        function() { $timeout(function () { process(); }); }
      );
    }
  };
}];
