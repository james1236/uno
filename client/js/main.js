var board = document.getElementById("board")
var backgroundRotation = 0;
//var backgroundGradient1 = [107,120,177,1];
var backgroundGradient1 = [116,131,201,1];
//var backgroundGradient2 = [51,71,177,1];
var backgroundGradient2 = [116,131,201,1];
var backgroundGradient3 = [22,51,207,1];

var gradientInterpolation = [0,0,100];

//This is "permenant" server side info
var players = [
	{
		name: "You",
		id: Math.random().toString(16).substr(2),
		wins: 0,
		games: 0,
		isuser: true,
	},	
	{
		name: "P2",
		id: Math.random().toString(16).substr(2),
		wins: 0,
		games: 0,
	},
];

function getPlayerById(id) {
	for (player of players) {
		if (player.id == id) {
			return player;
		}
	}
	return false;
}

//Temp game info that gets reset every round
var game = {
	stockPile: [],
	discardPile: [],
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
	game.stockPile = shuffle(referenceDeck);
	
	for (player of players) {
		game.playerDecks[player.id] = [];
	}
	
	if (!deal(config.maxCardsPerHand)) {
		alert("Too many players");
	}
	generateStockPile();
	generateDiscardPile();
	generatePlayerDecks();
}

function deal(cardsPerHand) {
	savedStockPile = JSON.parse(JSON.stringify(game.stockPile));
	savedPlayerDecks = JSON.parse(JSON.stringify(game.playerDecks));
	
	for (rep = 0; rep < cardsPerHand; rep++) {
		for (player of players) {
			if (game.stockPile.length <= 10) {
				//Not enough cards/too many players to get equal cards, try again with one less per player
				game.stockPile = JSON.parse(JSON.stringify(savedStockPile));
				game.playerDecks = JSON.parse(JSON.stringify(savedPlayerDecks));
				deal(cardsPerHand-1);
				return false;
			} else {
				game.playerDecks[player.id].push(game.stockPile.pop());
			}
		}
	}
	
	game.discardPile.push(game.stockPile.pop());
	
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
		if (getPlayerById(playerID).isuser) {
			card = generateCard(game.playerDecks[playerID][index],index);
			card.classList.add("cardPick");
		} else {
			card = generateCard("back",index);
		}

		card.style.left = "calc(50% + "+((index*deckSeperation-(deckSeperation*game.playerDecks[playerID].length/2)))+"px)";
		
		if (getPlayerById(playerID).isuser) {
			card.style.bottom = 24+"px";
		} else {
			card.style.top = -64+24+"px";
			card.style.transform = "rotate(180deg)";
		}
		deck.appendChild(card);
	}
	
	//deck.style.width = 48+(deckSeperation*(game.playerDecks[playerID].length-1));
	//deck.style.width = "0px";
	//deck.style.height = "0px";
	
	board.appendChild(deck);
	
	//deck.style.left = "50%";
	//deck.style.bottom = "96px";
	//deck.style.transformOrigin = "50% 50%";
}

function generateStockPile() {
	stock = document.createElement("div");
	stock.className = "pile";
	stock.id = "stock";
	
	stockPlaceholder = generateCard("back","stockPlaceholder");
	stockPlaceholder.style.top = "calc(50% - 32px)";
	stockPlaceholder.style.left = "calc(50% - 48px)";
	
	stock.appendChild(stockPlaceholder);
	board.appendChild(stock);
}

function generateDiscardPile() {	
	discard = document.createElement("div");
	discard.className = "pile";
	discard.id = "discard";
	
	discardPlaceholder = generateCard(game.discardPile[game.discardPile.length-1],"discardPlaceholder");
	discardPlaceholder.style.top = "calc(50% - 32px)";
	discardPlaceholder.style.left = "calc(50% + 24px)";
	
	discard.appendChild(discardPlaceholder);
	board.appendChild(discard);
}

function updatePlayerDecks() {
	decks = document.getElementsByClassName("deck");
	while (decks.length > 0) {
		decks[0].innerHTML = "";
		decks[0].id = "-";
		decks[0].parentNode.removeChild(decks[0]);
		decks = document.getElementsByClassName("deck");
	}
	generatePlayerDecks();
}

function updateStockPile() {
	stock = document.getElementsById("stock");
	
	stock.innerHTML = "";
	stock.id = "-";
	stock.parentNode.removeChild(stock);
		
	generateStockPile();
}

function updateDiscardPile() {
	discard = document.getElementsById("discard");
	
	discard.innerHTML = "";
	discard.id = "-";
	discard.parentNode.removeChild(discard);
		
	generateDiscardPile();
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

function getElementGlobalPosition(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}


function generateCard(cardType,index) {
	cardOuter = document.createElement("div");
	cardOuter.className = "card";
	cardOuter.id = cardType+"@"+index;
	
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
	
	board.style.background = "linear-gradient("+backgroundRotation+"deg, rgba("+backgroundGradient1[0]+","+backgroundGradient1[1]+","+backgroundGradient1[2]+","+backgroundGradient1[3]+") "+gradientInterpolation[0]+"%, rgba("+backgroundGradient2[0]+","+backgroundGradient2[1]+","+backgroundGradient2[2]+","+backgroundGradient2[3]+") "+gradientInterpolation[1]+"%, rgba("+backgroundGradient3[0]+","+backgroundGradient3[1]+","+backgroundGradient3[2]+","+backgroundGradient3[3]+") "+gradientInterpolation[2]+"%)";
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