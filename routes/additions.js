const router = require("express").Router();
const Addition = require("../controllers/additions");

router.post("/invoice/:id/create", async (req, res) => {
  Addition.createAddition(req, res);
});
router.delete("/:id/remove", async (req, res) => {
  Addition.removeAddition(req, res);
});
router.get("/invoice/:id/list", async (req, res) => {
  Addition.fetchAdditionPerInvoice(req, res);
});
module.exports = router;
