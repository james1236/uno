var board = document.getElementById("board")
var backgroundRotation = 0;
var backgroundGradient1 = [107,120,177,1];
var backgroundGradient2 = [51,71,177,1];

//This is "permenant" server side info
var players = [
	{
		name: "You",
		id: Math.random().toString(16).substr(2),
		wins: 0,
		games: 0,
		isuser: true,
	}
];

//Temp game info that gets reset every round
var game = {
	stockDeck: [],
	discardDeck: [],
	playerDecks: {},
};

//Temp game setup info that exists for a session
var config = {
	cardsPerHand: 5,
	 
}


var referenceDeck = [];
var colors = ["red","yellow","green","blue"];

function generateReferenceDeck() {
	for (color = 0; color < colors.length; color++) {
		referenceDeck.push(colors[color]+"-0");
		for (rep = 0; rep < 2; rep++) {
			for (num = 1; num <= 9; num++) {
				referenceDeck.push(colors[color]+"-"+num);
			}
			referenceDeck.push(colors[color]+"-"+"pick2");
			referenceDeck.push(colors[color]+"-"+"skip");
			referenceDeck.push(colors[color]+"-"+"reverse");
		}
	}
	for (rep = 0; rep < 4; rep++) {
		referenceDeck.push("wild");
		referenceDeck.push("wildpick4");
	}
}

generateReferenceDeck();
createGame();


function createGame() {
	clearBoard();
	game.stockDeck = shuffle(referenceDeck);
	
	for (player of players) {
		game.playerDecks[player.id] = game.stockDeck;
	}
	
	generateDecks();
}

function generateDecks() {
	var deckSeperation = 10;
	
	for (player of players) {
		deck = document.createElement("div");
		deck.className = "deck";
		deck.id = player.id;
		
		for (index = 0; index < game.playerDecks[player.id].length; index++) {
			card = generateCard(game.playerDecks[player.id][index]);
			card.style.top = "0px";
			card.style.left = (index*deckSeperation)+"px";
			deck.appendChild(card);
		}
		
		board.appendChild(deck);
		deck.style.top = "calc(50% - "+(deck.getBoundingClientRect().height/2)+"px)";
		deck.style.left = "calc(50% - "+((48+(index*deckSeperation))/2)+"px)";
		//fanDeck(deck.id);
	}
}

/*function fanDeck(deckID) {
	var angle = 20;
	var radius = 1;
	
	deck = document.getElementById(deckID);
	cards = deck.getElementsByClassName("card");
	
	center = Math.round(cards.length/2)-1;
	
	for (index = 0; index < cards.length; index++) {
		cards[index].style.transform = "rotate("+(angle*(index-center))+"deg)";
		//cards[index].style.top = ((Math.abs(index-center)+1)*6)+"px";
		
		cards[index].style.left = (parseInt(cards[index].style.left,10) + (Math.cos(angle*(index-center))*radius))+"px;";
		//cards[index].style.top = (Math.sin(angle*(index-center))*radius)+"px;";
	}
}*/

function generateCard(cardType) {
	console.log(cardType);
	cardOuter = document.createElement("div");
	cardOuter.className = "card";
	cardOuter.id = cardType;
	
	card = document.createElement("div");
	card.className = "card-inner";
	
	cardOuter.appendChild(card);
	
	var isColored = true;
	var overlaySrc;
	var underlaySrc;
	
	if (cardType.indexOf("-") == -1) {
		isColored = false;
		overlaySrc = cardType;
	} else {
		typeSplit = cardType.split("-");
		underlaySrc = typeSplit[0];
		overlaySrc = typeSplit[1];
	}
	
	overlaySrc = "img/cards/"+overlaySrc+".png";
	underlaySrc = "img/cards/"+underlaySrc+".png";
	
	cardFront = document.createElement("div");
	cardFront.className = "card-front";
	
	
	cardOverlay = document.createElement("img");
	cardOverlay.className = "cardOverlay";	
	cardOverlay.src = overlaySrc;
	
	cardFront.appendChild(cardOverlay);
	
	if (isColored) {
		cardUnderlay = document.createElement("img");
		cardUnderlay.className = "cardUnderlay";
		cardUnderlay.src = underlaySrc;
		
		cardFront.appendChild(cardUnderlay);
	}
	
	card.appendChild(cardFront);
	
	cardBack = document.createElement("div");
	cardBack.className = "card-back";
	
	card.appendChild(cardBack);
	
	return cardOuter;
}

function clearBoard () {
	board.innerHTML = "";
}

function backgroundUpdate() {
	backgroundRotation+=0.1;
	
	board.style.background = "linear-gradient("+backgroundRotation+"deg, rgba("+backgroundGradient1[0]+","+backgroundGradient1[1]+","+backgroundGradient1[2]+","+backgroundGradient1[3]+") 50%, rgba("+backgroundGradient2[0]+","+backgroundGradient2[1]+","+backgroundGradient2[2]+","+backgroundGradient2[3]+") 100%)";
}

setInterval(backgroundUpdate,1000/60);


function shuffle(b) {
	//https://stackoverflow.com/a/6274381/5493555
	a = JSON.parse(JSON.stringify(b));
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}