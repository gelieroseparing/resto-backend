const router = require('express').Router();

const CATEGORIES = ['Breakfast','Lunch','Dinner','Dessert','Drinks','Snack'];

router.get('/', (_req, res) => {
  res.json(CATEGORIES);
});

module.exports = router;
