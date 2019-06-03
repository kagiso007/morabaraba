var GAME = {
  init : function() {
  
    this.players        = [];
    this.players[0]     = new AI('the computer', true);
    this.players[1]     = new Human("player", false)
    this.currentPlayer  = this.players[Math.round(Math.random())];
    this.winMessage     = false;
    this.newGameButton  = false;
    this.catchCountdown = 50; 
    this.finalCountdown = 10; 
    var boardSize       = 24;
    this.boardSize      = boardSize;
    this.board          = [];
    this.boardHistory   = [];
    this.speed          = 100;
    while(boardSize--) this.board.push(undefined);
    this.graph = [
                    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
                    [1, 9], [3, 11], [5, 13], [7, 15],
                    [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 8],
                    [9, 17], [11, 19], [13, 21], [15, 23],
                    [16, 17], [17, 18], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 16],
                    [0, 8], [2, 10], [4, 12] ,[6, 14],
                    [8, 16], [10, 18], [12, 20] ,[14, 22]
                 ];
    this.graphLength = this.graph.length;
    this.lines = [[0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
                 [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
                 [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
                 [1, 9, 17], [3, 11, 19], [5, 13, 21], [0, 8, 16], [2, 10, 18], [4, 12, 20], [6, 14, 22], [7, 15, 23]];
    this.intersection = [1, 9, 17, 3, 11, 19, 5, 13, 21, 7, 15, 23, 0, 8, 16, 2, 10, 18, 4, 12, 20, 6, 14, 22];
    UI.init(this.boardSize);

    UI.Pieces.piecesCanvas.addEventListener('click', this.listenClick);

    this.run();
  },
  listenClick : function(event) {
    var isHuman = GAME.currentPlayer.type === 'human';
    if(isHuman) {
      GAME.currentPlayer.pickPosition(event);
    }
  },
  run : function() {
    var isAI = this.currentPlayer.type === 'AI'
    if(isAI) {
      var position = this.currentPlayer.pickPosition();
    }
  },
  setPieceOnPosition : function(position) {
    if (this.isValidPosition(position)) {
      this.checkGameState(position);
    } else {
      var isAI = this.currentPlayer.type === 'AI';
      if(isAI) { 
        this.currentPlayer.pickPosition();
      }
    }
  },
  checkGameState : function(position) {
    var currentPlayer  = this.currentPlayer;

    this.hasToDestroyEnemyPiece = this.hasToDestroyEnemyPiece || false;

    if(this.hasToDestroyEnemyPiece) {
      this.destroyPiece(position);
      this.hasToDestroyEnemyPiece = false;
    } else {
      if(this.getCurrentPhase() === PHASE.PLACING) {
        this.board[position] = currentPlayer.marker;
        UI.Pieces.drawPiece(position, currentPlayer.marker);
        currentPlayer.stockPieces--;

        this.isDestructionOption(position);
      } else if(this.getCurrentPhase() === PHASE.MOVING ) {
        var isAI = this.currentPlayer.type === 'AI';
        if(isAI) {
          this.board[position] = currentPlayer.marker;
          UI.Pieces.drawPiece(position, currentPlayer.marker);
        }
        this.isDestructionOption(position);
      } else if(this.getCurrentPhase() === PHASE.FLYING) {
        var isAI = this.currentPlayer.type === 'AI';
        if(isAI) {
          this.board[position] = currentPlayer.marker;
          UI.Pieces.drawPiece(position, currentPlayer.marker);
        }
        this.isDestructionOption(position);
      }
    }

    if(!this.hasToDestroyEnemyPiece) {
      this.endTurn();
    }
  },
  endTurn : function() {
    var tie = this.checkTie();
    if(tie) {
      this.endGame(tie);
    } else {
      this.updatePlayerPhase(this.getEnemy());  
      var enemyHasLost = this.checkEnemyFail(); 
      if(enemyHasLost) {
        this.endGame();
      } else {
        this.changePlayer();
        setTimeout(function(_this) { GAME.$scope.$apply(_this.run());}, GAME.speed, this);
      }
    }
  },
  getCurrentPhase : function(player) {
    player  = player || this.currentPlayer;

    var isPlacingPhase = player.phase.value === PHASE.PLACING.value;
    if(isPlacingPhase)
      return PHASE.PLACING;

    var isMovingPhase  = player.phase.value === PHASE.MOVING.value;
    if(isMovingPhase)
      return PHASE.MOVING;

    var isFlyingPhase  = player.phase.value === PHASE.FLYING.value;
    if(isFlyingPhase)
      return PHASE.FLYING;
  },
  updatePlayerPhase : function(player) {
    var player = player || this.currentPlayer;

    if(this.getCurrentPhase(player) === PHASE.PLACING) {
      var playerHasNoPiecesInStock = player.stockPieces === 0;
      if(playerHasNoPiecesInStock) {
        player.phase = PHASE.MOVING;
      }
    } else if(this.getCurrentPhase(player) === PHASE.MOVING) {
      var playerHasLessThanThreePieces = this.countPiecesOnBoard(player) === 3;
      if(playerHasLessThanThreePieces) {
        player.phase = PHASE.FLYING;
      }
    }
  },
  checkTie : function() {
    var result;

    var isNotPlacingPhase = this.currentPlayer.phase !== PHASE.PLACING;
    if(isNotPlacingPhase) {
      this.catchCountdown--;
    }

    var isBothFlyingPhase = this.currentPlayer.phase === PHASE.FLYING
                        &&  this.getEnemy().phase    === PHASE.FLYING;
    if(isBothFlyingPhase) {
      this.finalCountdown--;
    }

    if(this.catchCountdown === 0) {
      result = 'Tie: 50 moves without a catch';
    } else if(this.finalCountdown === 0) {
      result = 'Tie: 10 moves on the flying phase';
    } else {
      var placingPhaseIsOver = this.currentPlayer.stockPieces === 0
                            && this.getEnemy().stockPieces    === 0;
      if(placingPhaseIsOver) {
        if(this.isBoardTheSameForThreeTimes()) {
          result = 'Tie: The board is the same for three times';
        } else {
          this.boardHistory.push(this.board.toString());
        }
      }
    }

    return result;
  },

  isBoardTheSameForThreeTimes : function() {
    var currentBoard = this.board.toString();
    var countSameBoards = _.filter(this.boardHistory, function(board) {
      return board === currentBoard;
    }).length;

    var threeTimes = countSameBoards == 2 ? true : false;
    return threeTimes;
  },

  checkEnemyFail : function() {
    var enemyIsNotInFlyingPhase = this.getEnemy().phase !== PHASE.FLYING;
    var hasLost = this.enemyHasLessThanThreePieces() ||
      (this.isEnemySurrounded() && enemyIsNotInFlyingPhase);
    return hasLost;
  },
  enemyHasLessThanThreePieces : function() {
    var hasLessThanThreePieces = false;
    var piecesOnBoard = this.countPiecesOnBoard(this.getEnemy());
    if (piecesOnBoard + this.getEnemy().stockPieces < 3) {
      hasLessThanThreePieces = true;
    }

    return hasLessThanThreePieces;
  },
  isEnemySurrounded: function() {
    var isSurrounded = false;
    var enemy = !this.currentPlayer.marker;
    var enemyMovement = 0;
    var fail = false;

    _.each(this.board, function(marker, index) {
      if(enemy === marker) {
        _.each(this.graph, function(connection) {
          var isPathFromCurrentPosition = _.contains(connection, index);
          var neighborAvailable = this.board[_.without(connection, index)[0]] === undefined;
          if (isPathFromCurrentPosition && neighborAvailable) {
            enemyMovement++;
          }
        }, this);
      }
    }, this);

    var enemyIsStuck = enemyMovement === 0;
    var enemyNoPiecesInStock = this.getEnemy(this.currentPlayer).stockPieces === 0;
    if(enemyIsStuck && enemyNoPiecesInStock) {
      isSurrounded = true;
    }

    return isSurrounded;
  },
  countPiecesOnBoard: function(player) {
    player = player || this.currentPlayer;
    var piecesOnBoard = _.filter(this.board, function(marker) {
      return marker === player.marker;
    }, this).length;

    return piecesOnBoard;
  },
  isValidPosition : function(position, hasToBeEmptyPosition) {
    var isBadPosition = position === undefined || position < 0 || position > (this.boardSize - 1);
    var hasToDestroyEnemyPiece = this.hasToDestroyEnemyPiece;

    if(hasToBeEmptyPosition === undefined && !hasToDestroyEnemyPiece) {
      hasToBeEmptyPosition = true;
    }

    if (hasToDestroyEnemyPiece) {
      var isNotEnemyPiece = this.board[position] !== !this.currentPlayer.marker;
      var isEnemyPiece = !isNotEnemyPiece;
      var lineEnemyComplete = isEnemyPiece && this.isLineComplete(position);

      if (isNotEnemyPiece || lineEnemyComplete) {
        isBadPosition = true;
      }
    }
    if (hasToBeEmptyPosition) {
      isBadPosition = isBadPosition || this.board[position] !== undefined;
    }

    return !isBadPosition;
  },
  isValidMovement : function(origin, destination) {
    var result             = false;
    var originIsOwnPiece   = this.board[origin] === this.currentPlayer.marker;
    var destinationIsEmpty = this.board[destination] === undefined;
    var isMovingPhase      = this.currentPlayer.phase === PHASE.MOVING;
    var isFlyingPhase      = this.currentPlayer.phase === PHASE.FLYING;
    var isNeighborPosition = this.isNeighbor(origin, destination);

    if (originIsOwnPiece && destinationIsEmpty
        && ((isMovingPhase && isNeighborPosition) || isFlyingPhase)) {
      result = true;
    }

    return result;
  },
  movePiece : function(origin, destination) {
    var currentMarker = this.currentPlayer.marker;
    this.board[origin] = undefined;
    this.board[destination] = currentMarker;

    UI.Pieces.unselectPiece(origin, currentMarker);
    UI.Pieces.clearPiece(UI.Board.points[origin]);
    UI.Pieces.drawPiece(destination, currentMarker);
  },
  isNeighbor : function(origin, destination) {
    var isValid = false;

    _.each(this.graph, function(element) {
      if (!isValid) {
        if (element[0] === origin && element[1] === destination) {
          isValid = true;
        } else if (element[1] === origin && element[0] === destination) {
          isValid = true;
        }
      }
    });

    return isValid;
  },
  isLineComplete : function(position) {
    var result = false;
    _.each(this.lines, function(line) {
      if(_.contains(line, position)) {
        if(this.board[line[0]] === this.board[line[1]] && this.board[line[1]] === this.board[line[2]]) {
          result = true;
        }
      }
    }, this);
    return result;
  },
  isDestructionOption : function(position) {
    if (this.isLineComplete(position) && this.canRemoveEnemyPiece()) {
      this.catchCountdown = 50;
      this.boardHistory   = [];

      if (this.currentPlayer.type === 'AI') {
        var pieceToBeDestroyed = this.currentPlayer.selectEnemyPiece();
        if (pieceToBeDestroyed !== undefined) {
          this.destroyPiece(pieceToBeDestroyed);
        }
      } else {
        this.hasToDestroyEnemyPiece = true;
        GAME.$scope.$apply();
      }
    }
  },
  destroyPiece : function(pieceToBeDestroyed) {
    this.board[pieceToBeDestroyed] = undefined;
    UI.Pieces.clearPiece(UI.Board.points[pieceToBeDestroyed]);
  },
  
  canRemoveEnemyPiece: function() {
    var result = false;
    var isEnemyPiece, isLineIncomplete;
    _.each(this.board, function(marker, index) {
      isEnemyPiece     = marker === !this.currentPlayer.marker;
      isLineIncomplete = !this.isLineComplete(index);
      if (isEnemyPiece && isLineIncomplete) {
        result = true;
      }
    }, this);

    return result;
  },
  changePlayer : function() {
    this.currentPlayer = this.getEnemy();
  },
  getEnemy: function() {
    if(this.currentPlayer === this.players[0])
      return this.players[1];
    else
      return this.players[0];
  },
  endGame : function(message) {
    this.newGameButton = true;
    this.winMessage = message || this.currentPlayer.username + ' won!';
    UI.Pieces.piecesCanvas.removeEventListener('click', this.listenClick);
    this.$scope.$apply();
  },

  newGame : function() {
    this.newGameButton = false;
    this.init();
    this.run();
  }
};


angular.module('ngMorabaraba',[])
       .controller('ngMorabarabaCtrl', function($scope) {

  $scope.title = 'Morabaraba';
  $scope.GAME = GAME;

  GAME.$scope = $scope;

  GAME.init();
});