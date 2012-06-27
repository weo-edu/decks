Meteor.startup(function() {
	Decks.remove({});
	var decks = [
		{
			name: 'arithmetic',
			graphic: 'arithmetic.jpeg',
			cards: [
				{
					name: 'addition',
					graphic: 'addition.gif',
					problem: {
						template: '\\[{{a}} + {{b}}\\]',
						solution: 'a + b',
						rules: [
							'a is integer',
							'b is integer',
							'a < b',
							'b > 5'
						]
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '\\[{{a}} - {{b}} \\]',
						solution: 'a - b',
						rules: [
							'a is integer',
							'b is integer',
							'a > b',
							'b < 2'
						]
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '\\[{{a}} \\times {{b}} \\]',
						solution: 'a * b',
						rules: [
							'a is integer',
							'b is integer',
							'a > 2',
							'a < 6'
						]
					}
				}
			]
		},
		{
			name: 'word arithmetic',
			graphic: 'word_arithmetic.jpeg',
			cards: [
				{
					name: 'word addition',
					graphic: 'addition.gif',
					problem: {
						template: 'What is {{a}} plus {{b}}?',
						solution: 'a + b'
					}
				},
				{
					name: 'word subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: 'What is {{a}} minus {{b}}?',
						solution: 'a - b'
					}
				},
				{
					name: 'word multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: 'What is {{a}} times {{b}}?',
						solution: 'a * b'
					}
				}
			]
		}
	]
	_.each(decks,function(deck) {
		Decks.insert(deck);
	})
});