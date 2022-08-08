class Piece{
    constructor(name,position,color){
        this.name = name;
        this.position = position;
        this.color = color;
        this.element = document.createElement('img');
        this.element.src = `./assets/${name}-${color}.png`;
    }

    changePosition(position){
        this.position = position;
    }

    getTopMove(steps){
        const topMoves = [];
        for(let pos = this.position - 8; pos>=0 && steps>0; pos-=8,steps--) {
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color || this.name === 'pawn') break;
                else {
                    topMoves.push(pos);
                    break;
                }
            } 
            topMoves.push(pos);
        }
        return topMoves;
    }

    getBottomMove(steps){
        const bottomMoves = [];
        for(let pos = this.position + 8; pos<64 && steps>0; pos+=8,steps--) {
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color || this.name === 'pawn') break;
                else {
                    bottomMoves.push(pos);
                    break;
                }
            }
            bottomMoves.push(pos);
        }
        return bottomMoves;
    }

    getLeftMove(steps){
        const leftMoves = [];
        const limit = (this.position - this.position % 8);
        for(let pos = this.position - 1; pos>=limit && steps>0; pos--, steps--) {
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    leftMoves.push(pos);
                    break;
                }
            }
            leftMoves.push(pos);
        }
        return leftMoves;
    }

    getRightMove(steps){
        const rightMoves = [];
        const limit = (this.position - this.position % 8) + 8;
        for(let pos = this.position + 1; pos<limit && steps>0; pos++, steps--) {
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    rightMoves.push(pos);
                    break;
                }
            }
            rightMoves.push(pos);
        }
        return rightMoves;
    }

    getTopLeftMove(steps){
        const topLeftMoves = [];
        for(let pos = this.position - 8; pos>=0 && steps>0; pos-=8,steps--){
            const limit = pos - pos % 8;
            if((pos - 1) >= limit && (pos - 1 )< limit + 8){
                pos--;
            }else{
                break;
            }
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    topLeftMoves.push(pos);
                    break;
                }
            }
            topLeftMoves.push(pos);
        }
        return topLeftMoves;
    }

    getTopRightMove(steps){
        const topRightMoves = [];
        for(let pos = this.position - 8; pos>=0 && steps>0; pos-=8,steps--){
            const limit = pos - pos % 8;
            if((pos + 1) >= limit && (pos + 1) < limit + 8){
                pos++;
            }else{
                break;
            }
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    topRightMoves.push(pos);
                    break;
                }
            }
            topRightMoves.push(pos);
        }
        return topRightMoves;
    }

    getBottomLeftMove(steps){
        const bottomLeftMoves = [];
        for(let pos = this.position + 8; pos<64 && steps>0; pos+=8,steps--){
            const limit = pos - pos % 8;
            if((pos - 1) >= limit && (pos - 1) < limit + 8){
                pos--;
            }else{
                break;
            }
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    bottomLeftMoves.push(pos);
                    break;
                }
            }
            bottomLeftMoves.push(pos);
        }
        return bottomLeftMoves;
    }

    getBottomRightMove(steps){
        const bottomRightMoves = [];
        for(let pos = this.position + 8; pos<64 && steps>0; pos+=8,steps--){
            const limit = pos - pos % 8;
            if((pos + 1) >= limit && (pos + 1) < limit + 8){
                pos++;
            }else{
                break;
            }
            const pieceExist = pieces.find((piece) => piece.position === pos);
            if(pieceExist){
                if(pieceExist.color === this.color) break;
                else {
                    bottomRightMoves.push(pos);
                    break;
                }
            }
            bottomRightMoves.push(pos);
        }
        return bottomRightMoves;
    }
};

class Rook extends Piece{
    constructor(name,position,color){
        super(name,position,color);
        this.castling = true;
    }

    changePosition(position){
        this.position = position;
        this.castling = false;
    }

    getPossibleMove(){
        return [this.getTopMove(8),this.getBottomMove(8),this.getLeftMove(8),this.getRightMove(8)];
    }
};

class Pawn extends Piece{
    constructor(name,position,color){
        super(name,position,color);
        this.firstTurn = true;
    }

    changePosition(position){
        this.position = position;
        if(position > 56 || position < 8) game.promote(this);
        this.firstTurn = false;
    }

    getPossibleMove(){
        const steps = this.firstTurn ? 2 : 1;
        const allowedMoves = this.color === 'white' ? this.getTopMove(steps) : this.getBottomMove(steps);
        const attackMoves = [];
        const position = this.color === 'white' ? this.position - 8 : this.position + 8;
        const limit = position - position % 8;
        const pieceExist = [];
        if(position + 1 < limit + 8) pieceExist.push(pieces.find((piece) => piece.position === (position + 1) && piece.color != this.color));
        if(position - 1 >= limit) pieceExist.push(pieces.find((piece) => piece.position === (position - 1) && piece.color != this.color));
        pieceExist.forEach((piece) => {
            if(piece) attackMoves.push(piece.position);
        });
        return [allowedMoves, attackMoves];
    }
};

class Knight extends Piece{
    constructor(name,position,color){
        super(name,position,color);
    }

    outOfBounds(position, x){
        
        const limit = position - position % 8;
        return !(position + x >= limit && position + x < limit + 8 && position >= 0 && position < 64);
    }

    getPossibleMove(){
        const directionsX = [1,-1,-2,2,-1,1,2,-2];
        const directionsY = [-2,2,1,-1,-2,2,1,-1];
        const allowedMoves = [];
        for(let i = 0 ; i < 8 ; i++){
            if(!this.outOfBounds(this.position + directionsY[i]*8, directionsX[i])){
                const position = this.position + directionsX[i] + directionsY[i]*8;
                const pieceExist = pieces.find((piece) => piece.position === position && piece.color === this.color);
                if(pieceExist) continue;
                allowedMoves.push(position);
            }
        }
        return allowedMoves;
    }
};

class Bishop extends Piece{
    constructor(name,position,color){
        super(name,position,color);
    }

    getPossibleMove(){
        return [this.getTopRightMove(8),this.getTopLeftMove(8),this.getBottomRightMove(8),this.getBottomLeftMove(8)];
    }
};

class Queen extends Piece{
    constructor(name,position,color){
        super(name,position,color);
    }

    getPossibleMove(){
        return [
            this.getTopMove(8),this.getBottomMove(8),this.getLeftMove(8),this.getRightMove(8),
            this.getTopRightMove(8),this.getTopLeftMove(8),this.getBottomRightMove(8),this.getBottomLeftMove(8)
        ];
    }
};

class King extends Piece{
    constructor(name,position,color){
        super(name,position,color);
        this.castling = true;
    }

    changePosition(position){
        if(this.castling){
            if (position - this.position === 2) game.castleRook(position + 1, 'right');
			if (position - this.position === -2) game.castleRook(position - 2, 'left');
        }
        this.position = position;
        this.castling = false;
    }

    getPossibleMove(){
        return [
            this.getTopMove(1),this.getBottomMove(1),this.getLeftMove(1),this.getRightMove(1),
            this.getTopRightMove(1),this.getTopLeftMove(1),this.getBottomRightMove(1),this.getBottomLeftMove(1)
        ];
    }
};