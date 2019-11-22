var socket = io();

var board = document.getElementById("board")
var backgroundRotation = 0;
var backgroundTimer = 0;
var backgroundGradient1 = [63, 94, 251,0.5]; //unused extra gradient point
var backgroundGradient2 = [63, 94, 251,0.5];
var backgroundGradient3 = [252, 70, 107,0.5];
var gradientInterpolation = [0,0,100];

var gameState = "notStarted";
var userDrag = false;

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

function getPlayerIndexById(id) {
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == id) {
			return i;
		}
	}
	return -1;
}

function getUserPlayerID() {
	for (player of players) {
		if (player.isuser) {
			return player.id;
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

var referenceDeck = [];
generateReferenceDeck();

function generateReferenceDeck() {
	colors = ["red","yellow","green","blue"];
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

function createGame() {
	clearBoard();
	game.stockPile = shuffle(referenceDeck);
	
	for (player of players) {
		game.playerDecks[player.id] = [];
	}
	
	if (config.maxCardsPerHand > 0 && !deal(config.maxCardsPerHand)) {
		alert("Too many players");
	}
	generateStockPile();
	generateDiscardPile();
	generatePlayerDecks();
	setGameState("yourTurn");
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
				return deal(cardsPerHand-1);
			} else {
				game.playerDecks[player.id].push(game.stockPile.pop());
			}
		}
	}
	
	game.discardPile.push(game.stockPile.pop());
	return cardsPerHand;
}

function generatePlayerDecks() {
	for (player of players) {
		generatePlayerDeck(player.id);
	}
}

socket.on("addPlayer",function(data) { //"enqueuePlayer"
	players.push(data.player); //When new game is started?
	createPlayerDeck(data.player.id);
});

function setGameState(target) {
	gameState = target;
	switch (target) {
		case "yourTurn":
			for (player of players) {
				if (player.isuser) {
					document.getElementById(player.id).style.opacity = 1;
					for (card of document.getElementById(player.id).childNodes) {
						card.classList.add("cardPick");
						card.classList.remove("cardTease");
					}
				}
			}

			document.getElementById("back@stockPlaceholder").classList.add("cardPick");
			document.getElementById("back@stockPlaceholder").classList.remove("cardTease");

			break;
		case "otherTurn":
			for (player of players) {
				if (player.isuser) {
					document.getElementById(player.id).style.opacity = 0.5;
					for (card of document.getElementById(player.id).childNodes) {
						card.classList.remove("cardPick");
						card.classList.add("cardTease");
					}
				}
			}
			document.getElementById("back@stockPlaceholder").classList.remove("cardPick");
			document.getElementById("back@stockPlaceholder").classList.add("cardTease");
			
			break;
	}
}

function updateGameState() {
	setGameState(gameState);
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
		
		point.style = "position: fixed; grid-area: 1 / 1; left: calc(50% + "+(positionArray[positionArray.length-1][0]-5)+"px); top: calc(50% + "+(positionArray[positionArray.length-1][1]-5)+"px); width: 5px; height: 5px; transformOrigin: 50% 50%; transform: rotate("+(bearing+90)+"deg);";
		
		point.classList.add("cardFlip");
		
		circleTest.appendChild(point);
	}
	
	board.appendChild(circleTest);
}

function generatePlayerDeck(playerID) {
	//Calculate optimum deck curvature for it's length
	testvar = game.playerDecks[playerID].length;
	if (testvar < 3) {
		testvar = 3;
	}
	if (testvar < 10) {
		testvar+=2;
	}
	
	if (testvar > 22) {
		radius = 80000;
		if (testvar < 38) {
			radius = 80000;
			deckSeperation = 0.0125;
		} else {
			deckSeperation = 0.0075;
		}
	} else {
		radius = 500*(Math.pow(testvar/20,2))*3;
		deckSeperation = ((60.5-testvar)*30)/radius;
	}
	
	//Generate DOM deck
	deck = document.createElement("div");
	deck.className = "deck";
	deck.id = playerID;

	
	for (index = 0; index < game.playerDecks[playerID].length; index++) {
		if (getPlayerById(playerID).isuser) {
			card = generateCard(game.playerDecks[playerID][index],index);
			card.classList.add("cardPick");
		} else {
			if (players.length > 3) {
				if (testvar < 38) {
					deckSeperation = ((60.5-testvar)*30)/radius/4;
				} else {
					deckSeperation = ((60.5-testvar)*30)/radius/2;
				}
			}
			card = generateCard("back",index);
		}
		
		//The rotation around the board for a given player
		playerRotation = (360/players.length)*getPlayerIndexById(playerID);
		
		
		//The circle angle at which to draw the card
		bearing = (index*deckSeperation-(deckSeperation*(game.playerDecks[playerID].length-1)/2))-playerRotation-270;
		bearingCenter = (((game.playerDecks[playerID].length-1)/2)*deckSeperation-(deckSeperation*(game.playerDecks[playerID].length-1)/2))-playerRotation-270;

		//Used to calculate the Y positions around the curve for the deck
		topThing =  (Math.sin(rad(bearingCenter))-Math.sin(rad(bearing)))*radius-32+Math.sin(rad(bearingCenter))*(window.innerHeight/2-64-12);
		leftThing = (Math.cos(rad(bearingCenter))-Math.cos(rad(bearing)))*radius-24+Math.cos(rad(bearingCenter))*(window.innerWidth/2-64-12);
		
		//The rotation for each card
		card.style.transform = "rotate("+(bearing+270)+"deg)";
		
		//Used to calculate the X positions around the curve for the deck
		card.style.top = "calc(50% + "+topThing+"px";
		card.style.left = "calc(50% + "+leftThing+"px)";
		
		deck.appendChild(card);
	}
	
	if (getUserPlayerID() == playerID && gameState == "otherTurn") {
		deck.style.opacity = 0.5;
	}
	
	board.appendChild(deck);
}

function rad(angle) {
	return angle * (Math.PI / 180);
}

function generateStockPile() {
	stock = document.createElement("div");
	stock.className = "pile";
	stock.id = "stock";
	
	stockPlaceholder = generateCard("back","stockPlaceholder");
	stockPlaceholder.style.top = "calc(50% - 32px)";
	stockPlaceholder.style.left = "calc(50% - 24px - 36px)";	
	stockPlaceholder.classList.add("cardPick");
	
	stockPlaceholder2 = generateCard("back","stockPlaceholder2");
	stockPlaceholder2.style.top = "calc(50% - 32px)";
	stockPlaceholder2.style.left = "calc(50% - 24px - 36px)";
	
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
	discardPlaceholder.style.left = "calc(50% - 24px + 36px)";
	discardPlaceholder.classList.add("discardPlaceholder");
	
	discardPlaceholder2 = generateCard(game.discardPile[game.discardPile.length-1],"discardPlaceholder2");
	discardPlaceholder2.style.top = "calc(50% - 32px)";
	discardPlaceholder2.style.left = "calc(50% - 24px + 36px)";
	discardPlaceholder2.classList.add("discardPlaceholder2");
	
	discard.appendChild(discardPlaceholder2);
	discard.appendChild(discardPlaceholder);
	board.appendChild(discard);
}

function updatePlayerDecks() {
	if (gameState == "notStarted") {return};
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

function playerDeckInsertAtIndex(playerID,cardType,index,noUpdate=false) {
	if (index == -1) {
		index = game.playerDecks[playerID].length;
	}
	game.playerDecks[playerID].splice(index, 0, cardType);
	if (!noUpdate) {updatePlayerDeck(playerID);}
}

function playerDeckRemoveAtIndex(playerID,index,noUpdate) {
	game.playerDecks[playerID].splice(index, 1);
	if (!noUpdate) {updatePlayerDeck(playerID);}
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
	
	var overlaySrc;
	var underlaySrc;
	
	if (cardType.indexOf("-") == -1) {
		isColored = false;
		overlaySrc = cardType;
		underlaySrc = "black";
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
	
	cardUnderlay = document.createElement("img");
	cardUnderlay.className = "cardUnderlay";
	cardUnderlay.src = underlaySrc;
	
	cardFront.appendChild(cardUnderlay);
	
	card.appendChild(cardFront);
	
	cardBack = document.createElement("div");
	cardBack.className = "card-back";
	
	card.appendChild(cardBack);
	
	cardOuter.setAttribute('draggable', true);
	//cardOuter.setAttribute('ondrag', "draggingCard(event)");
	//cardOuter.setAttribute('ondrop', "dropCard(event)");
	//cardOuter.setAttribute('ondragover', "dragCardOver(event)");
	cardOuter.setAttribute('ondragstart', "dragCardStart(event)");
	
	return cardOuter;
}

var mouseX = 0;
var mouseY = 0;

function dragCardStart(e) {
	e.preventDefault();
	
	if (e.srcElement.id.indexOf("userDrag") != -1 || (!e.srcElement.classList.contains("cardPick") && !e.srcElement.classList.contains("cardTease"))) {
		return;
	}
	
	//Prevent drag if old drag unresolved
	if (document.getElementsByClassName("userDrag").length > 0) {
		return;
	}
	
	if (e.srcElement.id.indexOf("stock") != -1) {
		//Stock pile
		if (e.srcElement.classList.contains("cardTease")) {
			return; //Disallow taking cards while stock pile has the "tease" animation
		}
		card = generateCard(game.stockPile[game.stockPile.length-1],"userDrag");
		card.classList.add("cardNeutral");
	} else {
		//Other pile/deck (namely user deck)
		card = generateCard(e.srcElement.id.split("@",1)[0],"userDrag");
	}
	board.appendChild(card);
	
	card.style.left = e.x - 24 + "px";
	card.style.top = e.y - 32 + "px";
	card.style.transform = e.srcElement.style.transform;
	card.classList.add("userDrag");
	
	e.srcElement.style.display = "none";
	
	userDrag = true;
	document.getElementsByClassName("userDrag")[0].srcElement = e.srcElement;
	document.getElementsByClassName("userDrag")[0].card = card.id;
	document.getElementsByClassName("userDrag")[0].deck = e.srcElement.parentNode.id;
	
	if (getUserPlayerID() == e.srcElement.parentNode.id && gameState == "otherTurn") {
		document.getElementsByClassName("userDrag")[0].style.opacity = 0.5;
	}
}

document.addEventListener("mousemove", function (e) {
	if (e.touches == undefined) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	} else {
		mouseX = parseInt(e.touches[0].pageX);
		mouseY = parseInt(e.touches[0].pageY);
	}
	
	if (userDrag) {
		document.getElementById(document.getElementsByClassName("userDrag")[0].card).style.left = mouseX - 24 + "px";
		document.getElementById(document.getElementsByClassName("userDrag")[0].card).style.top = mouseY - 32 + "px";
		
		document.getElementById(document.getElementsByClassName("userDrag")[0].card).style.transition = "transform .3s";
		document.getElementById(document.getElementsByClassName("userDrag")[0].card).style.transform = "rotate(0deg)";
	}
}, false);

document.addEventListener("mouseup", function (e) {	

	if (userDrag) {
		userDragElm = document.getElementsByClassName("userDrag")[0];
		animationTimer = 0;
		
		if (userDragElm.deck != "stock" && returnInRange()) {
			//Return to deck
			animationTimer = 250;
			document.getElementById(userDragElm.card).style.transition = "all .25s";
			document.getElementById(userDragElm.card).style.left = userDragElm.srcElement.style.left;
			document.getElementById(userDragElm.card).style.top = userDragElm.srcElement.style.top;
			document.getElementById(userDragElm.card).style.transform = userDragElm.srcElement.style.transform;		
		} else {
			if (moveInRange() && userDragElm.deck != "stock") {
				//Move (rearrange) card within deck
				animationTimer = 200;
				testEEE = userDragElm.srcElement.id.split("@")[0];
				targetDeck = document.getElementById(userDragElm.deck);
				minIndex = 0;

				for (target of targetDeck.childNodes) {
					reveal = false;
					if (target.style.display == "none") {
						target.style.display = "block";
						reveal = true;
					}

					if (mouseX > target.offsetLeft) {
						minIndex = parseInt(target.id.split("@")[1],10);
					}
					if (reveal) {
						target.style.display = "none";
					}
				}
				endIndex = moveCard(userDragElm.deck,parseInt(userDragElm.srcElement.id.split("@")[1]),minIndex);
				targetDeck = document.getElementById(userDragElm.deck);
				
				for (target of targetDeck.childNodes) {
					if (target.id == (userDragElm.srcElement.id.split("@")[0]+"@"+endIndex)) {
						userDragElm.targetElement = target;
					}
				}
				
				userDragElm.targetElement.style.display = "none";
				document.getElementById(userDragElm.card).style.transition = "all .2s";
				document.getElementById(userDragElm.card).style.left = userDragElm.targetElement.style.left;
				document.getElementById(userDragElm.card).style.top = userDragElm.targetElement.style.top;
				document.getElementById(userDragElm.card).style.transform = userDragElm.targetElement.style.transform;

				updateGameState();				
			} else {
				if (userDragElm.deck == "stock") {
					//Take from stockPile
					cardTypeToAdd = game.stockPile.pop();
					playerDeckInsertAtIndex(getUserPlayerID(),cardTypeToAdd,-1);
					
					targetDeck = document.getElementById(getUserPlayerID());
					for (target of targetDeck.childNodes) {
						if (target.id == (cardTypeToAdd+"@"+(game.playerDecks[getUserPlayerID()].length-1))) {
							userDragElm.targetElement = target;
							break;
						}
					}
					
					userDragElm.style.opacity = 0.5;
					userDragElm.targetElement.style.display = "none";
					userDragElm.style.zIndex = "9999";
					
					document.getElementById(userDragElm.card).classList.add("cardFlip");
					
					animationTimer = 600;
					document.getElementById(userDragElm.card).style.transition = "all .6s";
					document.getElementById(userDragElm.card).style.left = userDragElm.targetElement.style.left;
					document.getElementById(userDragElm.card).style.top = userDragElm.targetElement.style.top;
					document.getElementById(userDragElm.card).style.transform = userDragElm.targetElement.style.transform;		
				} else {
					//Play card (add to discardPile)
					animationTimer = 500;
					
					document.getElementById(userDragElm.card).style.transition = "all .5s";
					document.getElementById(userDragElm.card).style.left = document.getElementsByClassName("discardPlaceholder2")[0].style.left;
					document.getElementById(userDragElm.card).style.top = document.getElementsByClassName("discardPlaceholder2")[0].style.top;
					document.getElementById(userDragElm.card).style.transform = "rotate(0deg)";
					
					playerDeckRemoveAtIndex(userDragElm.deck,parseInt(userDragElm.srcElement.id.split("@")[1]));
				}
				
				setGameState("otherTurn");
			}
		}
		
		//Remove userDrag element
		setTimeout(function () {
			userDragElm.srcElement.style.display = "block";
			while (document.getElementsByClassName("userDrag").length > 0) {
				if (document.getElementsByClassName("userDrag")[0].targetElement) {
					document.getElementsByClassName("userDrag")[0].targetElement.style.display = "block";
				}
				document.getElementsByClassName("userDrag")[0].innerHTML = "";
				document.getElementsByClassName("userDrag")[0].parentNode.removeChild(document.getElementsByClassName("userDrag")[0]);
			}
		},animationTimer);
		
		userDrag = false;
	}
}, false);


function returnInRange() {
	if (!moveInRange() && (gameState != "yourTurn" || ((window.innerHeight - (mouseY+32))*2 < (mouseY+32) - (document.getElementById("back@stockPlaceholder2").getBoundingClientRect().top+32)))) {
		return true;
	}
	return false;
}

function moveInRange() {
	if (mouseY > (window.innerHeight-64-48)) {
		return true;
	}
	return false;
}

function moveCard(playerID,startIndex,targetIndex) {
	var endIndex = targetIndex;
	if (targetIndex == startIndex || startIndex < 0 || targetIndex < 0 || startIndex > game.playerDecks[playerID].length || targetIndex > game.playerDecks[playerID].length) {
		return endIndex;
	}
	if (targetIndex < startIndex) {
		playerDeckInsertAtIndex(playerID,game.playerDecks[playerID][startIndex],targetIndex,true);
		playerDeckRemoveAtIndex(playerID,startIndex+1,true);
	} else {
		playerDeckInsertAtIndex(playerID,game.playerDecks[playerID][startIndex],targetIndex,true);
		playerDeckRemoveAtIndex(playerID,startIndex,true);
		endIndex = targetIndex-1;
	}
	updatePlayerDeck(playerID);
	return endIndex;
}

function distanceBetween(x1,y1,x2,y2) {
	a = x1 - x2;
	b = y1 - y2;

	return Math.abs(Math.sqrt( a*a + b*b ));
}

function clearBoard () {
	board.innerHTML = "";
}

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

//Fan test
/*setInterval(function () {
	config.maxCardsPerHand++;
	if (config.maxCardsPerHand > 50) {
		config.maxCardsPerHand = 1;
	}
	
	createGame();
},500);*/


function hideMenu() {
	if (gameState != "notStarted") {
		return;
	}
	
	startMouseOut();
	
	document.getElementsByClassName("debugButton")[0].classList.add("menuFadeOut");
	document.getElementById("title").classList.add("menuFadeOut");
	document.getElementById("subtitle").classList.add("menuFadeOut");
	document.getElementById("board").classList.add("menuFadeOut");
	document.getElementById("titlesContainer").classList.add("menuFadeOut");
	setTimeout(function () {document.getElementById("titlesContainer").style.display = "none";},400);
	
	createGame();
}

function startMouseEnter() {
	if (gameState != "notStarted") {
		return;
	}
	document.getElementById("title").classList.add("menuFadeOutTease");
	document.getElementById("subtitle").classList.add("menuFadeOutTease");
}

function startMouseOut() {
	document.getElementById("title").classList.remove("menuFadeOutTease");
	document.getElementById("subtitle").classList.remove("menuFadeOutTease");
}

document.getElementsByClassName("debugButton")[0].addEventListener("mousedown", hideMenu);
document.getElementsByClassName("debugButton")[0].addEventListener("mouseenter", startMouseEnter);
document.getElementsByClassName("debugButton")[0].addEventListener("mouseout", startMouseOut);

function backgroundUpdate() {
	backgroundTimer++;
	document.body.style.backgroundPosition = "right "+((backgroundTimer/3)%64)+"px bottom "+((backgroundTimer/3)%64)+"px";
	
	backgroundRotation+=0.21;
	
	bgg1 = JSON.parse(JSON.stringify(backgroundGradient1)); bgg2 = JSON.parse(JSON.stringify(backgroundGradient2)); bgg3 = JSON.parse(JSON.stringify(backgroundGradient3));
	
	if (gameState != "yourTurn") {
		bgg1[3] = 0.15; bgg2[3] = 0.15; bgg3[3] = 0.15;
	}
	
	if (gameState == "notStarted") {
		board.style.background = "rgba(0,0,0,0)";
	} else {
		board.style.background = "linear-gradient("+backgroundRotation+"deg, rgba("+bgg1[0]+","+bgg1[1]+","+bgg1[2]+","+bgg1[3]+") "+gradientInterpolation[0]+"%, rgba("+bgg2[0]+","+bgg2[1]+","+bgg2[2]+","+bgg2[3]+") "+gradientInterpolation[1]+"%, rgba("+bgg3[0]+","+bgg3[1]+","+bgg3[2]+","+bgg3[3]+") "+gradientInterpolation[2]+"%)";
	}
	
	requestAnimationFrame(backgroundUpdate);
}

backgroundUpdate();