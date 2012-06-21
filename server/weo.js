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
						template: '{{range "0" "10"}} + {{range "0" "10"}}',
						solution: 'vars.a + vars.b'
					}
				},
				{
					name: 'subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: '{{range "0" "10"}} - {{range "0" "10"}}',
						solution: 'vars.a - vars.b'
					}
				},
				{
					name: 'multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: '{{range "0" "10"}} * {{range "0" "10"}}',
						solution: 'vars.a * vars.b'
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
						template: 'What is {{range "0" "10"}} plus {{range "0" "10"}}?',
						solution: 'vars.a + vars.b'
					}
				},
				{
					name: 'word subtraction',
					graphic: 'subtraction.jpeg',
					problem: {
						template: 'What is {{range "0" "10"}} minus {{range "0" "10"}}?',
						solution: 'vars.a - vars.b'
					}
				},
				{
					name: 'word multiplication',
					graphic: 'multiplication.jpg',
					problem: {
						template: 'What is {{range "0" "10"}} times {{range "0" "10"}}?',
						solution: 'vars.a * vars.b'
					}
				}
			]
		}
	]
	_.each(decks,function(deck) {
		Decks.insert(deck);
	})
});