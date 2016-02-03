var app = angular.module('spatialDialogue', []);
app.controller('webAudioCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.Field = $window.Field;
}]);
