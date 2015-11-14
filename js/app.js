var init = function() {
    var board_width = function() {
        var height = $(window).height();

        var pc = parseInt(80 * height / 100) + 'px';
        $("#board").css('width', pc);
        $("#footer").css('width', pc);

        var font = parseInt(3.8 * height / 100) + 'px';
        $("body").css('font-size', font);
    };

    board_width();

    var game = new Chess();
    var stockfish = new Worker("js/stockfish.js");
    stockfish.onmessage = function(event) {
        if (event.data.substring(0,8) == 'bestmove') {
            var fromSq = event.data.substring(9,11);
            var toSq = event.data.substring(11,13);
            var promotion = event.data.substring(13,14);
            promotion = promotion === ' ' ? 'q' : promotion.toLowerCase();

            game.move({
                from: fromSq,
                to: toSq,
                promotion: promotion
            });

            board.position(game.fen());
        }
    };

    stockfish.postMessage('uci');
    stockfish.postMessage('ucinewgame');

    var onDragStart = function(source, piece, position, orientation) {
        // Disallow dragging computer's pieces and when game is over and it's not your turn
        if (game.game_over() || piece.search(/^w/) !== -1 || game.turn() === 'w') {
            return false;
        }
    };

    var computerMove = function() {
        // Think between 1-2 secs in the first six moves (twelve ply),
        // then 2-4 secs after.
        var minTime, maxTime;
        if (game.history().length <= 12) {
            minTime = 1000;
            maxTime = 2000;
        } else {
            minTime = 2000;
            maxTime = 4000;
        }

        var think = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go movetime ' + think);
    };

    var onDrop = function(source, target) {
        // see if the move is legal
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for example simplicity
        });

        // illegal move
        if (move === null) return 'snapback';

        if (game.turn() === 'w' && !game.game_over()) {
            computerMove();
        }
    };

    var onSnapEnd = function() {
        board.position(game.fen());
    };

    var board = ChessBoard('board', {
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
        showNotation: false,
        orientation: 'black',
        position: 'start',
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });

    // Randomly open e4 or d4.
    var open = (Math.floor(Math.random() * 2) == 0) ? 'e' : 'd';

    game.move({
        from: open + '2',
        to: open + '4'
    });

    board.position(game.fen());
};

$(document).ready(init);
