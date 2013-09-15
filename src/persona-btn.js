define(['jquery', 'https://login.persona.org/include.js'], function ($) {
  var LOCALSTORAGE_KEY = 'personaInfo';

  var PersonaBtn = function (element, options) {
    var self = this;

    options = options || {};

    self.$button = $(element);
    self.currentUser = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || {};
    self._csrf = $('[name="csrf"]').attr('content');

    self.$button.on('click', function() {
      if (self.$button.hasClass('sign-in')) {
        self.fire('progress');
        navigator.id.request({
          oncancel: function() {
            self.fire('sign-out');
          }
        });
      } else {
        self.fire('progress');
        navigator.id.logout();
      }
    });

    self.on('progress', function(e) {
      self.progress();
    });

    self.on('sign-in', function(e) {
      self.signIn();
    });

    self.on('sign-out', function() {
      self.signOut();
    });
  };

  PersonaBtn.prototype.fire = function(eventName, data) {
    var self = this;
    self.$button.trigger(eventName, data);
  };

  PersonaBtn.prototype.on = function(eventName, callback) {
    var self = this;
    self.$button.on(eventName, callback);
  };

  PersonaBtn.prototype.signIn = function() {
    var self = this;
    self.$button.addClass('sign-out');
    self.$button.removeClass('sign-in');
    self.$button.removeClass('progress');
  };

  PersonaBtn.prototype.signOut = function() {
    var self = this;
    self.$button.removeClass('sign-out');
    self.$button.addClass('sign-in');
    self.$button.removeClass('progress');
  };

  PersonaBtn.prototype.progress = function() {
    var self = this;
    self.$button.removeClass('sign-out');
    self.$button.removeClass('sign-in');
    self.$button.addClass('progress');
  };


  PersonaBtn.prototype.init = function () {
    var self = this;

    if (self.currentUser.email  ) {
      self.fire('sign-in', self.currentUser);
    }

    navigator.id.watch({
      loggedInUser: self.currentUser.email,
      onlogin: function (assertion) {
        $.ajax({
          type: 'POST',
          url: '/persona/verify',
          data: {
            assertion: assertion,
            _csrf: self._csrf
          },
          success: function (res, status, xhr) {
            console.log(res);
            self.currentUser = res;
            self.fire('sign-in', res);
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(res));
          },
          error: function (res, status, xhr) {
            self.fire('sign-in-error');
          }
        });
      },
      onlogout: function () {
        $.ajax({
          url: '/persona/logout',
          type: 'POST',
          data: {
            _csrf: self._csrf
          },
          success: function (res, status, xhr) {
            $.get('/logout', function () {
              self.fire('sign-out');
              localStorage.removeItem(LOCALSTORAGE_KEY);
            });
          },
          error: function (res, status, xhr) {
            console.log('logout failure ', res);
            self.fire('sign-out-error');
          }
        });
      }
    });
  };

  return PersonaBtn;
});
