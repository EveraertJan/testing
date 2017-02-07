

class User {
  constructor(id, questions, avatar) {
    this._id = id;
    this._questions = questions;
    this._avatar = avatar;
  }

  getId() {
    return this._id;
  }
  getNextQuestion() {
    if(this._questions.length > 0) {
      const next = this._questions[0];
      this._questions.pop() // ? 
      return next;
    } else {
      return {};
    }
  }
  getAvatar() {
    return this._avatar;
  }
}


module.exports = User;