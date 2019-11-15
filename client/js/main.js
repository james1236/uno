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
	},
];

//Temp game info that gets reset every round
var game = {
	stockDeck: [],
	discardDeck: [],
	playerDecks: {},
};

//Temp game setup info that exists for a session
var config = {
	maxCardsPerHand: 5,
	 
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
		game.playerDecks[player.id] = [];
	}
	
	if (!deal(config.maxCardsPerHand)) {
		alert("Too many players");
	}
	generatePlayerDecks();
}

function deal(cardsPerHand) {
	savedStockDeck = JSON.parse(JSON.stringify(game.stockDeck));
	savedPlayerDecks = JSON.parse(JSON.stringify(game.playerDecks));
	
	for (rep = 0; rep < cardsPerHand; rep++) {
		for (player of players) {
			if (game.stockDeck.length <= 10) {
				//Not enough cards/too many players to get equal cards, try again with one less per player
				game.stockDeck = JSON.parse(JSON.stringify(savedStockDeck));
				game.playerDecks = JSON.parse(JSON.stringify(savedPlayerDecks));
				deal(cardsPerHand-1);
				return false;
			} else {
				game.playerDecks[player.id].push(game.stockDeck.pop());
			}
		}
	}
	
	return true;
}

function generatePlayerDecks() {
	for (player of players) {
		generatePlayerDeck(player.id);
	}
}

function generatePlayerDeck(playerID) {
	var deckSeperation = 24;
	
	deck = document.createElement("div");
	deck.className = "deck";
	deck.id = playerID;
	
	for (index = 0; index < game.playerDecks[playerID].length; index++) {
		card = generateCard(game.playerDecks[playerID][index]);
		card.style.top = "0px";
		card.style.left = (index*deckSeperation)+"px";
		deck.appendChild(card);
	}
	
	board.appendChild(deck);
	deck.style.left = "calc(50% - "+((48*(game.playerDecks[playerID].length+1)-deckSeperation*(game.playerDecks[playerID].length+0.5))/2)+"px)";
	deck.style.bottom = "calc("+(deck.getBoundingClientRect().height/2)+"px + 0px)";
	//fanDeck(deck.id);
}


function updatePlayerDecks() {
	decks = document.getElementsByClassName("deck");
	for (deck of decks) {
		deck.innerHTML = "";
		deck.parentNode.removeChild(deck);
	}
	generatePlayerDecks();
}

function updatePlayerDeck(playerID) {
	deck = document.getElementById(playerID);
	deck.innerHTML = "";
	deck.parentNode.removeChild(deck);

	generatePlayerDeck(playerID);
}

function playerDeckPush(cardType,playerID) {
	game.playerDecks[playerID].push(cardType);
	updatePlayerDeck(playerID);
}

function playerDeckRemoveAtIndex(index,playerID) {
	game.playerDecks[playerID].splice(index, 1);
	updatePlayerDeck(playerID);
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