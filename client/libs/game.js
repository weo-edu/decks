function Game(deck,num_problems) {
	this.deck = deck;
	this.num_problems = num_problems;
	this.card_idxs = [];
	this.cur_idx = 0;
	this.cur_problem;
  while (this.card_idxs.length < num_problems) {
    this.card_idxs.push(Math.floor(Math.random()*deck.cards.length))
  }
  this.results = new LocalCollection;
}

Game.prototype.nextCard = function() {
	if (this.cur_idx >= this.num_problems) return null;
	var card = _.clone(this.deck.cards[this.card_idxs[this.cur_idx]]);
	this.cur_idx++;
	this.current_card = card;
	this.cur_problem = new Problem(card.problem)
	card.question = this.cur_problem.generate()
	return card;
}

Game.prototype.isSolution = function(val) {
	return this.cur_problem.isSolution(val);
}

Game.prototype.recordResult = function(correct) {
	this.current_card.result = correct;
	this.results.insert(this.current_card);
}