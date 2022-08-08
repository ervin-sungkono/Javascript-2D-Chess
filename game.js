_id = (id) => {return document.getElementById(id)};

_class = (className) => {return document.getElementsByClassName(className)};

class Game{
    constructor(pieces){
        this.board = _id('game-board');
        this.boardCells = _class('board');
        this.turn = 'White';
        this.turnSign = _id('turn-sign');
        this.selectedPiece = null;
        this.allowedMoves = null;
        this.pieces = pieces;
        this.whiteCemetery = _id('white-cemetery');
        this.blackCemetery = _id('black-cemetery');
        this.tracker = _id('position-tracker');
        this.checked = false;
        this.setBoard();
        this.setEventListeners();
    }

    setBoard(){
        const gameBoard = this.board;
        gameBoard.innerHTML = "";
        const parentNode = document.createElement('div');
        parentNode.classList.add('board');
        this.tracker.innerHTML = "";
    
        for(let i = 0; i < 8; i++){
            for(let j = 0; j < 8 ;j++){
                const element = parentNode.cloneNode(false);
                element.classList.add((i+j) % 2 === 0 ? 'white' : 'black');
                element.id = (j+i*8);
                gameBoard.appendChild(element);
            }  
        }

        this.pieces.forEach((piece) => {
            _id(`${piece.position}`).appendChild(piece.element);
        })
    }

    clearBoard(){
        this.allowedMoves = null;

        const allowedBoard = _class('green');
        Array.from(allowedBoard).forEach((board) => {
            board.classList.remove('green');
        });

        const clickedBoard = _class('clicked')[0];
        if(clickedBoard) clickedBoard.classList.remove('clicked');
    }

    setEventListeners(){
        this.pieces.forEach((piece) => {
			this.setEventListener(piece);
		});
		Array.from(this.boardCells).forEach((cell) => {
			cell.addEventListener("click", this.movePiece.bind(this)); 
			cell.addEventListener("dragover", function(event){
				event.preventDefault();
			}); 
			cell.addEventListener("drop", this.movePiece.bind(this)); 
		});
    }

    setEventListener(piece){
		piece.element.addEventListener("click", this.pieceMove.bind(this)); 
		piece.element.addEventListener("dragstart", this.pieceMove.bind(this)); 
		piece.element.addEventListener("drop", this.pieceMove.bind(this));
    }

    changeTurn(){
        this.checked = false;
        this.turn = (this.turn === 'White') ?  'Black' : 'White';
        this.turnSign.innerHTML = `${this.turn}'s Turn`;
    }

    pieceMove(e){
        const piecePosition = e.target.parentNode.getAttribute('id');
        const piece = this.findPieceByPosition(piecePosition);
        const allowedMoves = this.getAllowedMoves(e,piece);
        if(allowedMoves){
            const clickedBoard = _id(`${piecePosition}`);
            clickedBoard.classList.add('clicked');
            allowedMoves.forEach((move) => {
                this.boardCells[move].classList.add('green');
            });
        }
    }

    movePiece(e, cell='') {
		cell = cell || e.target;
		if (cell.classList.contains('green')) {
			const clickedPiece = this.clickedPiece;
			if (clickedPiece) {
                const oldPosition = clickedPiece.position
				const newPosition = parseInt(cell.getAttribute('id'));
                this.tracker.innerHTML += `${clickedPiece.color} ${clickedPiece.name} from ${coordinates[oldPosition]} to ${coordinates[newPosition]}\n`;
                clickedPiece.changePosition(newPosition);
                if(clickedPiece.name === 'pawn' && clickedPiece.promoted){
                    clickedPiece.element.remove();
                }else{
                    cell.appendChild(clickedPiece.element);
                }
                this.clearBoard();
                this.changeTurn();
                this.checked = this.isChecked(this.turn);
				if (this.checked){
					if(this.isCheckmate(this.turn)) this.gameover(clickedPiece.color);
                    else{
                        this.tracker.innerHTML += `${this.turn} Checked!`
                    }
				}
			}
			else{
				return 0;
			}
		}
        if(e) e.preventDefault();
	}

    getAllowedMoves(e,piece){
		if(this.turn.toLowerCase() === piece.color.toLowerCase()){
			this.clearBoard();
			this.clickedPiece = piece;
			if (e.type === 'dragstart') {
				e.dataTransfer.setData("text", e.target.id);
			}

			let possibleMoves = piece.getPossibleMove().reduce((moves, move) => moves.concat(move),[]);
            if (piece.name === 'king') {
				possibleMoves = this.getCastlingPositions(possibleMoves);
                possibleMoves = possibleMoves.filter((move) => this.kingCanMove(move));
			}
            if(this.checked) this.allowedMoves = this.getUnblockedMoves(possibleMoves, piece.name);
            else {
                possibleMoves = possibleMoves.filter((move) => this.kingCanMove(move));
                this.allowedMoves = possibleMoves;
            }
			return this.allowedMoves;
		}
		else if (this.clickedPiece && this.turn.toLowerCase() === this.clickedPiece.color && this.allowedMoves && this.allowedMoves.indexOf(piece.position) != -1) {
            this.tracker.innerHTML += `${this.clickedPiece.color} ${this.clickedPiece.name} kills ${piece.color} ${piece.name}\n`
            this.destroy(piece);
		}
        return null;
    }

    getUnblockedMoves(allowedMoves, pieceName){
        if(pieceName != 'king'){
            const unblockedPositions = Array.from(_class('red')).map((position => parseInt(position.getAttribute('id'))));
            return allowedMoves.filter((move) => unblockedPositions.includes(move) && this.kingCanMove(move));
        }
        else{
            const enemyColor = this.turn === 'White' ? 'black' : 'white';
            const enemyPieces = this.findPiecesByColor(enemyColor);
            let blockedPositions = [];
            enemyPieces.forEach(enemyPiece => {
                const allowedMoves = enemyPiece.getPossibleMove().reduce((moves, move) => moves.concat(move),[]);
                blockedPositions.push(allowedMoves);
            });
            blockedPositions = blockedPositions.reduce((moves, move) => moves.concat(move),[])
            return allowedMoves.filter((move) => !blockedPositions.includes(move) && this.kingCanMove(move));
        }
    }

    getCastlingPositions(allowedMoves) {
		if (!this.clickedPiece.castling || this.checked) return allowedMoves;
        const rooks = this.findPiecesByName(this.turn, 'rook');
		const rook1 = rooks[0], rook2 = rooks[1];
		if (rook1 && rook1.castling) {
			const castlingPosition = rook1.position + 2;
            const leftMoves = this.clickedPiece.getLeftMove(3);
            if(leftMoves.length === 3 && this.kingCanMove(castlingPosition))
			allowedMoves.push(castlingPosition);
		}
		if (rook2 && rook2.castling) {
			const castlingPosition = rook2.position - 1;
            const rightMoves = this.clickedPiece.getRightMove(2);
            if(rightMoves.length === 2 && this.kingCanMove(castlingPosition))
			allowedMoves.push(castlingPosition);
		}
		return allowedMoves;
	}

    castleRook(rookPosition, rookDirection) {
		const rook = this.findPieceByPosition(rookPosition);
		const newPosition = rookDirection === 'right' ? rook.position - 2 : rook.position + 3;

		this.clickedPiece = rook;
		const chosenSquare = _id(newPosition);
		chosenSquare.classList.add('clicked');

		this.movePiece('', chosenSquare);
		this.changeTurn();
	}

    kingCanMove(position, kill = true){
        const piece = this.clickedPiece;
        console.log(this.clickedPiece)
		const originalPosition = piece.position;
		const otherPiece = this.findPieceByPosition(position);
		const can_kill = kill && (otherPiece || false) && otherPiece.name != 'king';
        piece.position = position;
        if (can_kill) this.pieces.splice(this.pieces.indexOf(otherPiece), 1);  
        const isChecked = this.isChecked(piece.color);
		if(can_kill) this.pieces.push(otherPiece);
		piece.position = originalPosition;
		return !isChecked;
    }

    isChecked(turn) {
        const checkedBoard = _class('red');
        if(!this.checked)
        Array.from(checkedBoard).forEach((board) => {
            board.classList.remove('red');
        });
		const king = this.findPiecesByName(turn,'king')[0];
		const enemyColor = (turn === 'White') ? 'black' : 'white';
		const enemyPieces = this.findPiecesByColor(enemyColor);
        let isChecked = false;
        enemyPieces.forEach((enemyPiece) => {
            const allowedMoves = enemyPiece.getPossibleMove();
            if(Array.isArray(allowedMoves[0])){
                allowedMoves.forEach((moves) => {
                    if(moves.includes(king.position)){
                        moves.forEach((move) => this.boardCells[move].classList.add('red'));
                        this.boardCells[enemyPiece.position].classList.add('red');
                        isChecked = true;
                    }
                })
            }
            else if(allowedMoves.includes(king.position)){
                allowedMoves.forEach((move) => this.boardCells[move].classList.add('red'));
                this.boardCells[enemyPiece.position].classList.add('red');
                isChecked = true;
            };
        });
		return isChecked;
	}

    isCheckmate(turn){
        const color = turn.toLowerCase();
        const pieces = this.findPiecesByColor(color);
        let isCheckmate = true;
        pieces.forEach((piece) => {
            this.clickedPiece = piece;
            const allowedMoves = this.getUnblockedMoves(piece.getPossibleMove().reduce((moves, move) => moves.concat(move),[]),piece.name);
            if(allowedMoves.length > 0) isCheckmate = false;
        });
		this.clickedPiece = null;
		return isCheckmate;
    }

    gameover(color){
        const interval = 5000;
        const winner = color.charAt(0).toUpperCase() + color.substring(1);
        this.tracker.innerHTML += `${winner} Wins!`;
        let i = 0;
        let timeout = () => {
            this.tracker.innerHTML += `Starting new game in ${(interval - i)/1000} seconds`;
            if(i < interval){
                setTimeout(timeout, 1000);
                i += 1000;
            }
        }
        setTimeout(() => location.reload(), interval);
    }

    findPieceByPosition(position){
        return this.pieces.find((piece) => piece.position == position);
    }

    findPiecesByName(color, name){
        return this.pieces.filter((piece) => piece.color === color.toLowerCase() && piece.name === name);
    }

    findPiecesByColor(color){
        return this.pieces.filter((piece) => piece.color === color);
    }

    destroy(piece) {
        piece.element.remove();

		(piece.color === 'white') ? this.blackCemetery.appendChild(piece.element.cloneNode(false)) : this.whiteCemetery.appendChild(piece.element.cloneNode(false));

		const chosenSquare = document.getElementById(piece.position);
		this.pieces.splice(this.pieces.indexOf(piece), 1);
		this.movePiece('', chosenSquare);
	}

    promote(pawn) {
        const promotedList = ['queen','bishop','knight','rook'];
        let promotedPiece;
        do{
            promotedPiece = prompt('Input promoted piece [ Queen | Bishop | Knight | Rook ]: ','Queen');
            promotedPiece = promotedPiece.toLowerCase();
        }while(!promotedList.includes(promotedPiece));

        const newName = promotedPiece;
        const color = pawn.color;
        const position = pawn.position;
        pawn.element.remove();
		this.pieces.splice(this.pieces.indexOf(pawn), 1);

        let piece;
        switch(promotedPiece){
            case 'queen':
                piece = new Queen(newName,position,color);
                break;
            case 'knight':
                piece = new Knight(newName,position,color);
                break;
            case 'bishop':
                piece = new Bishop(newName,position,color);
                break;
            case 'rook':
                piece = new Rook(newName,position,color);
                break;
        };
        this.pieces.push(piece);
        this.boardCells[position].appendChild(piece.element);
        this.setEventListener(piece);
    }
}

const xCoor = ['a','b','c','d','e','f','g','h'];
const yCoor = ['1','2','3','4','5','6','7','8'];
const coordinates = xCoor.flatMap(x => yCoor.map(y => x + y));

const pieces = [
    //Black Pieces
    new Rook('rook',0,'black'),
    new Rook('rook',7,'black'),
    new Knight('knight',1,'black'),
    new Knight('knight',6,'black'),
    new Bishop('bishop',2,'black'),
    new Bishop('bishop',5,'black'),
    new Queen('queen',3,'black'),
    new King('king',4,'black'),
    new Pawn('pawn',8,'black'),
    new Pawn('pawn',9,'black'),
    new Pawn('pawn',10,'black'),
    new Pawn('pawn',11,'black'),
    new Pawn('pawn',12,'black'),
    new Pawn('pawn',13,'black'),
    new Pawn('pawn',14,'black'),
    new Pawn('pawn',15,'black'),
    //White Pieces
    new Rook('rook',56,'white'),
    new Rook('rook',63,'white'),
    new Knight('knight',57,'white'),
    new Knight('knight',62,'white'),
    new Bishop('bishop',58,'white'),
    new Bishop('bishop',61,'white'),
    new Queen('queen',59,'white'),
    new King('king',60,'white'),
    new Pawn('pawn',48,'white'),
    new Pawn('pawn',49,'white'),
    new Pawn('pawn',50,'white'),
    new Pawn('pawn',51,'white'),
    new Pawn('pawn',52,'white'),
    new Pawn('pawn',53,'white'),
    new Pawn('pawn',54,'white'),
    new Pawn('pawn',55,'white'),
];

const game = new Game(pieces);

const target = _id('position-tracker');

const observer = new MutationObserver(() => {
    target.scrollTop = target.scrollHeight;
});

observer.observe(target,{
    childList: true
});