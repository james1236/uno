var board = document.getElementById("board")
var backgroundRotation = 0;
var backgroundTimer = 0;
//var backgroundGradient1 = [107,120,177,0.25];
//var backgroundGradient2 = [107,120,177,0.25];
//var backgroundGradient3 = [51,71,177,0.25];
var backgroundGradient1 = [63,94,251,0.25];
var backgroundGradient2 = [63,94,251,0.25];
var backgroundGradient3 = [252,70,107,0.25];

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
	maxCardsPerHand: 7,
	 
}

//Fan test
/* setInterval(function () {
	config.maxCardsPerHand++;
	if (config.maxCardsPerHand > 40) {
		config.maxCardsPerHand = 1;
	}
	
	createGame();
},500);*/


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

function drawUnitCircle() {
	if (document.getElementById("circleTest")) {
		circleTest = document.getElementById("circleTest");
		circleTest.innerHTML = "";
		circleTest.parentNode.removeChild(circleTest);
	}
		
	radius = 250;
	angularStep = 10;
	startBearing = -90;
	
	positionArray = [];
	circleTest = document.createElement("div");
	circleTest.id = "circleTest";
	circleTest.style = "position: absolute; display: grid;width: 0px;height: 0px;";
	
	for (bearing = startBearing; bearing < 360+startBearing; bearing+=angularStep) {
		positionArray.push([
			Math.cos((bearing)*Math.PI/180)*radius, //x
			Math.sin((bearing)*Math.PI/180)*radius, //y
			bearing, //currentBearing
		]);
		
		point = generateCard(referenceDeck[Math.floor(Math.random()*referenceDeck.length)],0);
		point.id = bearing;
		
		point.style = "position: fixed; grid-area: 1 / 1; left: calc(50% + "+(positionArray[positionArray.length-1][0]-24)+"px); top: calc(50% + "+(positionArray[positionArray.length-1][1]-32)+"px); width: 48px; height: 64px; transformOrigin: 50% 50%; transform: rotate("+(bearing+90)+"deg);";
		
		point.classList.add("cardFlip");
		
		circleTest.appendChild(point);
	}
	
	board.appendChild(circleTest);
}

function generatePlayerDeck(playerID) {
	testvar = game.playerDecks[playerID].length;
	if (testvar < 3) {
		testvar = 3;
	}
	if (testvar < 10) {
		testvar+=2;
	}
	
	if (testvar > 22) {
		testvar+=2;
		testvar = 22;
	}
	
	radius = 500*(Math.pow(testvar/20,2))*3;
	deckSeperation = ((60.5-testvar)*30)/radius;
	
	deck = document.createElement("div");
	deck.className = "deck";
	deck.id = playerID;
	
	for (index = game.playerDecks[playerID].length-1; index > -1; index--) {
		if (getPlayerById(playerID).isuser) {
			card = generateCard(game.playerDecks[playerID][index],index);
			card.classList.add("cardPick");
		} else {
			card = generateCard("back",index);
		}

		//card.style.left = "calc(50% + "+((index*deckSeperation-(deckSeperation*game.playerDecks[playerID].length/2)))+"px)";
			//Math.cos((bearing)*Math.PI/180)*radius, //x
			//Math.sin((bearing)*Math.PI/180)*radius, //y
			//bearing, //currentBearing
			
		//card.style.left = "calc(50% + "+((index*deckSeperation-(deckSeperation*game.playerDecks[playerID].length/2)))+"px)";
		//card.style.left = "calc(50% + "+Math.cos((bearing)*Math.PI/180)*radius+"px)";
		
		bearing = ((index*deckSeperation-(deckSeperation*(game.playerDecks[playerID].length-1)/2)))+90;
		//alert(bearing);
		//card.style.left = "calc(50% + "+((Math.cos((bearing)*Math.PI/180)*radius)-radius)+"px)";
		
		card.style.left = "calc(50% + "+((Math.cos((bearing)*Math.PI/180)*radius))+"px)";
		//Math.cos((bearing)*Math.PI/180)*radius
		
		if (getPlayerById(playerID).isuser) {
			card.style.bottom = 48+(Math.sin((bearing)*Math.PI/180)*radius)-radius+"px";
			card.style.transform = "rotate("+(-bearing+90)+"deg)";
		} else {
			card.style.top = 48+(Math.sin((bearing)*Math.PI/180)*radius)-radius+"px";
			card.style.transform = "rotate("+(90+bearing)+"deg)";
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
	stockPlaceholder.classList.add("cardPick");
	
	stockPlaceholder2 = generateCard("back","stockPlaceholder2");
	stockPlaceholder2.style.top = "calc(50% - 32px)";
	stockPlaceholder2.style.left = "calc(50% - 48px)";
	
	stock.appendChild(stockPlaceholder2);
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
	backgroundTimer++;
	document.body.style.backgroundPosition = "right "+((backgroundTimer/2)%64)+"px bottom "+((backgroundTimer/2)%64)+"px";
	
	backgroundRotation+=0.1;
	
	board.style.background = "linear-gradient("+backgroundRotation+"deg, rgba("+backgroundGradient1[0]+","+backgroundGradient1[1]+","+backgroundGradient1[2]+","+backgroundGradient1[3]+") "+gradientInterpolation[0]+"%, rgba("+backgroundGradient2[0]+","+backgroundGradient2[1]+","+backgroundGradient2[2]+","+backgroundGradient2[3]+") "+gradientInterpolation[1]+"%, rgba("+backgroundGradient3[0]+","+backgroundGradient3[1]+","+backgroundGradient3[2]+","+backgroundGradient3[3]+") "+gradientInterpolation[2]+"%)";
	
	requestAnimationFrame(backgroundUpdate);
}

//console.log("bgInterval: "+setInterval(backgroundUpdate,1000/60));
backgroundUpdate();


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