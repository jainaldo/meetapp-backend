import jwt from "jsonwebtoken";
import User from "../models/User";
import authCondig from "../../config/auth";

class SessionController {
  async store(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (!(await user.checkPassword(password))) {
      return res.status(400).json({ error: "Password does not match" });
    }

    const { id, name } = user;

    return res.json({
      user: {
        id,
        name
      },
      token: jwt.sign({ id }, authCondig.secret, {
        expiresIn: authCondig.expiresIn
      })
    });
  }
}

export default new SessionController();
