var express = require('express');
var Habitat = require('habitat');
var nunjucks = require('nunjucks');
var routes = require('./routes')();
var Meatspace = require('meatspace');
var expressPersona = require('express-persona');
var moment = require('moment');

Habitat.load();

var app = express();
var env = new Habitat();
var optimize = env.get('OPTIMIZE');

var meat = new Meatspace({
  fullName: 'Kate Hudson',
  username: 'k88hudson',
  postUrl: 'katespace.herokuapp.com/recent.json',
  db: 0,
  limit: 10
});

var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader(__dirname + '/src'), {
  autoescape: false
});

var maxAge = '31556952000';
var cacheSettings = {
  maxAge: optimize ? maxAge : undefined
};

nunjucksEnv.express(app);

app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.methodOverride());

app.use(express.static(__dirname + '/dist', {}));
app.use(express.static(__dirname + '/public', cacheSettings));
app.use('/bower_components', express.static(__dirname + '/bower_components', cacheSettings));

app.use(express.cookieParser());
app.use(express.cookieSession({
  key: 'meatspace.sid',
  secret: env.get('SESSION_SECRET'),
  cookie: {
    maxAge: 2678400000, // 31 days. Persona saves session data for 1 month
  },
  proxy: true
}));
app.use(express.bodyParser());
app.use(express.csrf());

app.use(function (req, res, next) {
  res.locals.session = req.session;
  res.locals.csrf = req.session._csrf;
  next();
});

app.use(app.router);

function errorHandler(err, req, res, next) {
  console.log(err);
  res.render('src/error.html', {
    status: res.statusCode,
    error: err
  });
}

function isAdmin(req, res, next) {
  if (req.session.email === env.get('ADMIN_EMAIL')) {
    return next();
  } else {
    res.statusCode = 403;
    return next(new Error('Not authorized to edit posts.'));
  }
}

app.use(errorHandler);

app.get('/', function (req, res, next) {
  meat.shareRecent(0, function (err, messages) {
    if (err) {
      return next(err);
    }
    messages = messages.map(function(message) {
      message.content.created = moment.unix(message.content.created).fromNow();
      return message;
    });
    res.render('index.html', {
      meats: messages
    });
  });
});

app.get('/logout', function (req, res) {
  req.session.email = null;
  res.redirect('/');
});

app.get('/post/:id', function (req, res) {
  var id = req.params.id;
  meat.get(id, function (err, message) {
    if (err || !message) {
      return res.send(err);
    }
    res.render('index.html', {
      meats: [message]
    });
  });
});

app.post('/create', isAdmin, function (req, res, next) {
  var message = {
    content: {
      title: req.body.title,
      message: req.body.message,
      urls: req.body.urls || []
    },
    meta: {
      location: req.body.location,
      isPrivate: req.body.isPrivate || false
    }
  };
  meat.create(message, function (err, message) {
    if (err) {
      return next(err);
    }
    message.content.created = moment.unix(message.content.created).fromNow();
    res.send({
      status: 'okay',
      message: message
    });
  });
});

app.post('/delete', isAdmin, function (req, res) {
  var id = req.body.id;
  meat.get(id, function (err, message) {
    if (err) {
      res.statusCode = 500;
      return res.send(err);
    }
    meat.del(message.id, function (err, status) {
      if (err) {
        res.statusCode = 500;
        return res.send(err);
      }
      res.send({
        status: status,
        id: id
      });
    });
  });
});

expressPersona(app, {
  audience: env.get('PERSONA_AUDIENCE'),
  verifyResponse: function (error, req, res, email) {
    if (error) {
      return res.send(error);
    }
    res.send({
      status: 'okay',
      email: email,
      isAdmin: email === env.get('ADMIN_EMAIL')
    });
  }
});

app.listen(env.get('PORT'), function () {
  console.log('Now listening on http://localhost:%d', env.get('PORT'));
});
