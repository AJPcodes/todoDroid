// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('todo', ['ionic', 'ngCordova'])
/**
 * The Projects factory handles saving and loading projects
 * from local storage, and also lets us save and load the
 * last active project index.
 */
.factory('Projects', function() {
  return {
    all: function() {
      var projectString = window.localStorage['projects'];
      if(projectString) {
        return angular.fromJson(projectString);
      }
      return [];
    },
    save: function(projects) {
      window.localStorage['projects'] = angular.toJson(projects);
    },

    delete: function(projectIndex){

      var projectString = window.localStorage['projects'];

      if(projectString) {
        var projects = angular.fromJson(projectString);
        projects.splice(projectIndex, 1);
        window.localStorage['projects'] = angular.toJson(projects);
      }


    },
    newProject: function(projectTitle) {
      // Add a new project
      return {
        title: projectTitle,
        tasks: []
      };
    },
    getLastActiveIndex: function() {
      return parseInt(window.localStorage['lastActiveProject']) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage['lastActiveProject'] = index;
    }
  }
})

.controller('TodoCtrl', function($scope, $timeout, $ionicModal, Projects, $ionicSideMenuDelegate, $ionicPlatform, $cordovaDeviceMotion) {

  // A utility function for creating a new project
  // with the given projectTitle
  var createProject = function(projectTitle) {
    var newProject = Projects.newProject(projectTitle);
    $scope.projects.push(newProject);
    Projects.save($scope.projects);
    $scope.selectProject(newProject, $scope.projects.length-1);
  }


  // Load or initialize projects
  $scope.projects = Projects.all();

  // Grab the last active, or the first project
  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];

  // Called to create a new project
  $scope.newProject = function() {
    var projectTitle = prompt('Project name');
    if(projectTitle) {
      createProject(projectTitle);
    }
  };

  // Called to select the given project
  $scope.selectProject = function(project, index) {
    Projects.setLastActiveIndex(index);
    $scope.activeProject = project;
    $ionicSideMenuDelegate.toggleLeft(false);
  };

    // Called to delete the given project
  $scope.deleteProject = function(index) {
    console.log('delete, ', index);
    Projects.delete(index);
    Projects.setLastActiveIndex(0);
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
    $scope.projects = Projects.all();

  };

  // Create our modal
  $ionicModal.fromTemplateUrl('new-task.html', function(modal) {
    $scope.taskModal = modal;
  }, {
    scope: $scope
  });

  $scope.createTask = function(task) {
    if(!$scope.activeProject || !task) {
      return;
    }
    $scope.activeProject.tasks.push({
      title: task.title
    });
    $scope.taskModal.hide();

    // Inefficient, but save all the projects
    Projects.save($scope.projects);

    task.title = "";
  };

  $scope.newTask = function() {
    $scope.taskModal.show();
  };

  $scope.randomizeTasks = function() {
    var newList = [];

   for (i = 0; i < $scope.activeProject.tasks.length; i++){
    if (Math.random() * 10 > 5) {
      newList.push($scope.activeProject.tasks[i]);
    } else {
      newList.unshift($scope.activeProject.tasks[i]);
    }

   }

   $scope.activeProject.tasks = newList;

  };

  $scope.deleteTask = function(taskIndex) {
    $scope.activeProject.tasks.splice(taskIndex, 1);

    Projects.save($scope.projects);

  };

  $scope.closeNewTask = function() {
    $scope.taskModal.hide();
  }

  $scope.toggleProjects = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };


  // Try to create the first project, make sure to defer
  // this by using $timeout so everything is initialized
  // properly
  $timeout(function() {
    if($scope.projects.length == 0) {
      while(true) {
        var projectTitle = prompt('Your first project title:');
        if(projectTitle) {
          createProject(projectTitle);
          break;
        }
      }
    }
  });


  /*SHAKE DETECTION CODE GOES HERE!*/
  document.addEventListener("deviceready", function () {

   // watch Acceleration options
    $scope.options = {
        frequency: 1001, // Measure every 100ms
        deviation : 25  // We'll use deviation to determine the shake event, best values in the range between 25 and 30
    };

    // Current measurements
    $scope.measurements = {
        x : null,
        y : null,
        z : null,
        timestamp : null
    }

    // Previous measurements
    $scope.previousMeasurements = {
        x : null,
        y : null,
        z : null,
        timestamp : null
    }

    // Watcher object
    $scope.watch = null;

    // Start measurements when Cordova device is ready

        //Start Watching method
        $scope.startWatching = function() {

 // Clean previous measurements
            $scope.previousMeasurements = {
                    x: null,
                    y: null,
                    z: null
            }
            // Device motion configuration
            $scope.watch = $cordovaDeviceMotion.watchAcceleration($scope.options);

            // Device motion initilaization
            $scope.watch.then(null, function(error) {
                console.log('Error');
            },function(result) {
                // Set current data
                $scope.measurements.x = result.x;
                $scope.measurements.y = result.y;
                $scope.measurements.z = result.z;
                $scope.measurements.timestamp = result.timestamp;

                // Detecta shake
                console.log('trying to detect shake');
                $scope.detectShake(result);

            });

        };



        // Stop watching method
        $scope.stopWatching = function() {
            $scope.watch.clearWatch();
        };

        $scope.processShake = function(){
          console.log('Shake detected'); // shake detected
          $scope.randomizeTasks();
        };

        // Detect shake method
        $scope.detectShake = function(result) {


            //Object to hold measurement difference between current and old data
            var measurementsChange = {};

            // Calculate measurement change only if we have two sets of data, current and old
            if ($scope.previousMeasurements.x !== null) {
                measurementsChange.x = Math.abs($scope.previousMeasurements.x, result.x);
                measurementsChange.y = Math.abs($scope.previousMeasurements.y, result.y);
                measurementsChange.z = Math.abs($scope.previousMeasurements.z, result.z);
            }

            // If measurement change is bigger then predefined deviation
            if (measurementsChange.x + measurementsChange.y + measurementsChange.z >= $scope.options.deviation) {

                $scope.stopWatching();
                $cordovaDeviceMotion.clearWatch($scope.watch) // Stop watching because it will start triggering like hell
                $scope.processShake();

                setTimeout(function(){
                  $scope.startWatching();
                }, 5000);
                // Clean previous measurements after succesfull shake detection, so we can do it next time


            } else {
                // On first measurements set it as the previous one
                $scope.previousMeasurements = {
                    x: result.x,
                    y: result.y,
                    z: result.z
                }
            }

        }

      $scope.startWatching();

    }); //end ready device

    $scope.$on('$ionicView.beforeLeave', function(){
        $scope.watch.clearWatch(); // Turn off motion detection watcher
    });



  /*SHAKE DETECTION CODE GOES HERE!*/



})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})
