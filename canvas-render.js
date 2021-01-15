class CanvasRender {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cellWidth = canvas.width / game.getNumRows();
        this.cellHeight = canvas.height / game.getNumColumns();
        this.game = game;
        this.drawFunctionById = {};

        this.drawFunctionById[game.cellTypes.empty] = this.drawEmptyCell.bind(this);

        this.drawFunctionById[game.cellTypes.playerLeft] = this.drawPlayerCellBase.bind(this, game.cellTypes.playerLeft);
        this.drawFunctionById[game.cellTypes.playerUp] = this.drawPlayerCellBase.bind(this, game.cellTypes.playerUp);
        this.drawFunctionById[game.cellTypes.playerRight] = this.drawPlayerCellBase.bind(this, game.cellTypes.playerRight);
        this.drawFunctionById[game.cellTypes.playerDown] = this.drawPlayerCellBase.bind(this, game.cellTypes.playerDown);

        this.drawFunctionById[game.cellTypes.enemyLeft] = this.drawEnemyCellBase.bind(this, game.cellTypes.playerLeft);
        this.drawFunctionById[game.cellTypes.enemyUp] = this.drawEnemyCellBase.bind(this, game.cellTypes.playerUp);
        this.drawFunctionById[game.cellTypes.enemyRight] = this.drawEnemyCellBase.bind(this, game.cellTypes.playerRight);
        this.drawFunctionById[game.cellTypes.enemyDown] = this.drawEnemyCellBase.bind(this, game.cellTypes.playerDown);

        this.drawFunctionById[game.cellTypes.bulletLeft] = this.drawBulletCell.bind(this);
        this.drawFunctionById[game.cellTypes.bulletUp] = this.drawBulletCell.bind(this);
        this.drawFunctionById[game.cellTypes.bulletRight] = this.drawBulletCell.bind(this);
        this.drawFunctionById[game.cellTypes.bulletDown] = this.drawBulletCell.bind(this);
    }

    drawEmptyCell(row, column) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(column * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
    }

    drawGun(direction, row, column) {
        this.ctx.beginPath();
        this.ctx.moveTo(column * this.cellWidth + this.cellWidth / 2, row * this.cellHeight + this.cellHeight / 2);
        switch (direction) {
            case game.cellTypes.playerLeft: {
                this.ctx.lineTo(column * this.cellWidth, row * this.cellHeight + this.cellHeight / 2);
                break;
            }
            case game.cellTypes.playerUp: {
                this.ctx.lineTo(column * this.cellWidth + this.cellWidth / 2, row * this.cellHeight);
                break;
            }
            case game.cellTypes.playerRight: {
                this.ctx.lineTo(column * this.cellWidth + this.cellWidth, row * this.cellHeight + this.cellHeight / 2);
                break;
            }
            case game.cellTypes.playerDown: {
                this.ctx.lineTo(column * this.cellWidth + this.cellWidth / 2, row * this.cellHeight + this.cellHeight);
                break;
            }
            default: {
                throw new Error("UNKNOWN DIRECTION");
            }
        }
        this.ctx.stroke();
    }

    drawRobotBase(strokeStyle, direction, row, column) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = strokeStyle;
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(column * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
        this.drawGun(direction, row, column);
    }

    drawPlayerCellBase(direction, row, column) { this.drawRobotBase("#00FF00", direction, row, column); }

    drawEnemyCellBase(direction, row, column) { this.drawRobotBase("#0000FF", direction, row, column); }

    drawBulletCell(row, column) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = "#FF0000";
        this.ctx.lineWidth = 3;
        this.ctx.arc(
            column * this.cellWidth + this.cellWidth / 2,
            row * this.cellHeight + this.cellHeight / 2,
            this.cellWidth / 7, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let row = 0; row < this.game.getNumRows(); ++row) {
            for (let column = 0; column < this.game.getNumColumns(); ++column) {
                let drawFunction = this.drawFunctionById[this.game.getCellState(row, column)];
                drawFunction(row, column);
            }
        }
    }
}