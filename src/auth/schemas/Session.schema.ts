import * as mongoose from 'mongoose';

export const SessionSchema = new mongoose.Schema({
  session: {
    cookie: {},
    session: {
      userId: mongoose.Schema.Types.ObjectId,
      userLoggedIn: { type: Boolean, default: false },
    },
  },
});
