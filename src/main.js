requirejs.config({
  baseUrl: '/bower_components',
  paths: {
    src: '..',
    templates: '../templates',
    nunjucks: 'nunjucks/browser/nunjucks',
    jquery: 'jquery/jquery',
  }
});

require([
  'jquery',
  'templates',
  'nunjucks',
  'src/persona-btn'

], function (
  $,
  templates,
  nunjucks,
  PersonaBtn
) {
  // console.log(nunjucks.env.render('src/index.html'));
  var personaBtn = new PersonaBtn('.persona-button');
  var $top = $('.top');
  var $form = $('form.new-post');
  var $formInputs = $form.find('[data-input]');
  var _csrf = $('meta[name="csrf"]').attr('content');

  // Admin UI
  $('[data-admin-only]').hide();
  $('[data-signed-in-only]').hide();
  $('.toggle-colours').click(function() {
    console.log('dasd');
    $('body').toggleClass('light');
  });

  // Set up add
  $('.add').on('click', function (e) {
    e.preventDefault();
    var formData = {};
    $formInputs.each(function(i, el) {
      console.log(el);
      var $el = $(el);
      formData[$el.attr('name')] = $el.val();
    });
    formData._csrf = _csrf;
    console.log(formData);
    $.post('/create', formData, function (data) {
      var $el;
      if (data) {
        $el = $(nunjucks.env.render('src/meat-template.html', {
          meat: data.message
        }));
        $('.meat:first-of-type').before($el);
        $el.find('.remove').on('click', onRemoveClick);
        $formInputs.val('');
      }
    });
  });

  // Set up remove
  function onRemoveClick() {
    var $meat = $(this).closest('.meat');
    var id = $meat.data('id');
    $.post('/delete', {
      _csrf: _csrf,
      id: id
    }, function (data) {
      if (data.id) {
        $meat.slideUp();
      }
    });
  }
  $('.remove').on('click', onRemoveClick);

  // Set up persona BTN
  personaBtn.on('sign-in', function (event, data) {
    $top.slideDown();
    $('.email').html(data.email);
    $('[data-signed-in-only]').fadeIn();
    if (data.isAdmin) {
      $('[data-admin-only]').fadeIn();
    }
  });
  personaBtn.on('sign-out', function () {
    $top.slideUp();
    $('[data-signed-in-only]').fadeOut();
    $('[data-admin-only]').fadeOut();
  });
  personaBtn.init();

});
