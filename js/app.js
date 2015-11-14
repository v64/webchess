var init = function() {
    var board_width = function() {
        var height = $(window).height();
        var pc = (80 * height) / 100;
        var font = (0.5 * height) / 10;
        pc = parseInt(pc) + 'px';
        font = parseInt(font) + 'px';
        $("#board").css('width', pc);
        $("body").css('font-size', font);
        console.log(pc);
    };

    board_width();
    //$(window).bind('resize', board_width);

    var game = new Chess();
    var stockfish = new Worker("js/stockfish.js");
    stockfish.onmessage = function(event) {
        //console.log(event.data);

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

            //console.log('Move:' + fromSq + ' ' + toSq);

            board.position(game.fen());
        }
    };

    stockfish.postMessage('uci');
    stockfish.postMessage('ucinewgame');

    var onDragStart = function(source, piece, position, orientation) {
        // Disallow dragging computer's pieces and when game is over
        if (game.game_over() || piece.search(/^b/) !== -1) {
            return false;
        }
    };

    var computerMove = function() {
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go movetime 1000');
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

        if (game.turn() === 'b' && !game.game_over()) {
            computerMove();
        }
    };

    var onSnapEnd = function() {
        board.position(game.fen());
    };

    var board = ChessBoard('board', {
        pieceTheme: 'img/chesspieces/wikipedia/{piece}.png',
        showNotation: false,
        position: 'start',
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    });
};

$(document).ready(init);
