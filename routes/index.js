module.exports = function(){
  return {
    index: function(meat) {
      return function(req, res) {
        res.render('index.html');
      };
    },
  };
};
