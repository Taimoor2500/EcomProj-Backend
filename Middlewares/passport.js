const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../Models/loginModel');
const bcrypt = require('bcrypt');

passport.use(
  new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        

        return done(null, user); 
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
