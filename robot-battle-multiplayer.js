class RobotGame {
    constructor(numRows, numColumns, firstStrategy, secondStrategy, memory1, offset1, memory2, offset2) {
        this.firstStrategy = firstStrategy;
        this.secondStrategy = secondStrategy;
        this.sizeCellInBytes = 1;
        this.field = new Field(memory1.buffer, offset1, numRows, numColumns, this.sizeCellInBytes);

        this.gameStates = {
            "InProgress": 0,
            "Victory": 1,
            "Defeat": 2,
            "Draw": 3,
        };

        this.state = this.gameStates.InProgress;

        this.cellTypes = {
            "empty": 0,
            "playerLeft": 1,
            "playerUp": 2,
            "playerRight": 3,
            "playerDown": 4,
            "enemyLeft": 5,
            "enemyUp": 6,
            "enemyRight": 7,
            "enemyDown": 8,
            "bulletLeft": 9,
            "bulletUp": 10,
            "bulletRight": 11,
            "bulletDown": 12,
        };

        this.actions = {
            "moveLeft": 0,
            "moveUp": 1,
            "moveRight": 2,
            "moveDown": 3,
            "fire": 4,
            "doNothing": 5,
        };

        for (let row = 0; row < numRows; ++row) {
            for (let column = 0; column < numColumns; ++column) {
                this.field.setCell(row, column, this.cellTypes.empty);
            }
        }

        this.updateEnemyState = this.updateEnemyStrategy.bind(this, memory2, offset2);
    }

    updateEnemyStrategy(memory, offset) {
        this.field.copyTo(memory.buffer, offset);
    }

    getState() { return this.state; }

    isBullet(id) {
        return id == this.cellTypes.bulletLeft
            || id == this.cellTypes.bulletUp
            || id == this.cellTypes.bulletRight
            || id == this.cellTypes.bulletDown;
    }

    isPlayer(id) {
        return id == this.cellTypes.playerLeft
            || id == this.cellTypes.playerUp
            || id == this.cellTypes.playerRight
            || id == this.cellTypes.playerDown;
    }

    isEnemy(id) {
        return id == this.cellTypes.enemyLeft
            || id == this.cellTypes.enemyUp
            || id == this.cellTypes.enemyRight
            || id == this.cellTypes.enemyDown;
    }

    isPlayerBulletCollision(firstActor, secondActor) {
        return (this.isPlayer(firstActor) && this.isBullet(secondActor))
            || (this.isBullet(firstActor) && this.isPlayer(secondActor));
    }

    isEnemyBulletCollision(firstActor, secondActor) {
        return (this.isEnemy(firstActor) && this.isBullet(secondActor))
            || (this.isBullet(firstActor) && this.isEnemy(secondActor));
    }

    isPlayerEnemyCollision(firstActor, secondActor) {
        return (this.isPlayer(firstActor) && this.isEnemy(secondActor))
            || (this.isEnemy(firstActor) && this.isPlayer(secondActor));
    }

    doStep() {
        this.playerAction = this.firstStrategy();
        this.updateEnemyState();
        this.enemyAction = this.secondStrategy();

        let newField = this.createNewCollisionField();
        for (let row = 0; row < this.getNumRows(); ++row) {
            for (let column = 0; column < this.getNumColumns(); ++column) {
                let cellState = this.getCellState(row, column);
                switch (cellState) {
                    case this.cellTypes.empty: {
                        newField[row][column].push(this.cellTypes.empty);
                        break;
                    }
                    case this.cellTypes.playerLeft:
                    case this.cellTypes.playerUp:
                    case this.cellTypes.playerRight:
                    case this.cellTypes.playerDown: {
                        this.handleStrategyAction(newField, row, column);
                        break;
                    }
                    case this.cellTypes.enemyLeft:
                    case this.cellTypes.enemyUp:
                    case this.cellTypes.enemyRight:
                    case this.cellTypes.enemyDown: {
                        this.handleStrategyAction(newField, row, column);
                        break;
                    }
                    case this.cellTypes.bulletLeft:
                    case this.cellTypes.bulletUp:
                    case this.cellTypes.bulletRight:
                    case this.cellTypes.bulletDown: {
                        this.handleBullet(newField, row, column, cellState);
                        break;
                    }
                }
            }
        }

        this.state = this.handleCollisions(newField);
        if (this.state == this.gameStates.InProgress) {
            this.writeResultField(newField);
        }
    }

    handleBullet(newField, row, column, bulletType) {
        newField[row][column].push(this.cellTypes.empty);

        let nextCoordinate = this.getBulletConfig(bulletType).nextCoordinate(row, column);
        let nextCellState = this.getCellState(nextCoordinate.row, nextCoordinate.column);
        let oppositeBulletType = this.getBulletConfig(bulletType).oppositeBulletType;
        let oppositeActionType = this.getBulletConfig(bulletType).oppositeActionType;

        if (nextCellState == oppositeBulletType) {
            newField[nextCoordinate.row][nextCoordinate.column].push(bulletType);
            newField[nextCoordinate.row][nextCoordinate.column].push(oppositeBulletType);
            newField[row][column].push(bulletType);
            newField[row][column].push(oppositeBulletType);

            // Mark as handled.
            this.field.setCell(nextCoordinate.row, nextCoordinate.column, this.cellTypes.empty);
        } else if ((this.isPlayer(nextCellState) && oppositeActionType == this.playerAction)
            || (this.isEnemy(nextCellState) && oppositeActionType == this.enemyAction)) {
            newField[nextCoordinate.row][nextCoordinate.column].push(bulletType);
            newField[nextCoordinate.row][nextCoordinate.column].push(nextCellState);
            newField[row][column].push(bulletType);
            newField[row][column].push(nextCellState);

            // Mark as handled.
            this.field.setCell(nextCoordinate.row, nextCoordinate.column, this.cellTypes.empty);
        } else {
            newField[nextCoordinate.row][nextCoordinate.column].push(bulletType);
        }
    }

    getBulletConfig(bulletType) {
        switch (bulletType) {
            case this.cellTypes.bulletLeft: {
                return {
                    oppositeBulletType: this.cellTypes.bulletRight,
                    oppositeActionType: this.actions.moveRight,
                    nextCoordinate: this.getLeftCell.bind(this)
                };
            }
            case this.cellTypes.bulletUp: {
                return {
                    oppositeBulletType: this.cellTypes.bulletDown,
                    oppositeActionType: this.actions.moveDown,
                    nextCoordinate: this.getUpCell.bind(this)
                };
            }
            case this.cellTypes.bulletRight: {
                return {
                    oppositeBulletType: this.cellTypes.bulletLeft,
                    oppositeActionType: this.actions.moveLeft,
                    nextCoordinate: this.getRightCell.bind(this)
                };
            }
            case this.cellTypes.bulletDown: {
                return {
                    oppositeBulletType: this.cellTypes.bulletUp,
                    oppositeActionType: this.actions.moveUp,
                    nextCoordinate: this.getDownCell.bind(this)
                };
            }
        }
        alert("master, what have you done with that bullet!");
    }

    getLeftCell(row, column) {
        let leftColumn = column == 0 ? (this.getNumColumns() - 1) : (column - 1);
        return { row: row, column: leftColumn };
    }

    getUpCell(row, column) {
        let upRow = row == 0 ? (this.getNumRows() - 1) : (row - 1);
        return { row: upRow, column: column };
    }

    getRightCell(row, column) {
        let rightColumn = column == (this.getNumColumns() - 1) ? 0 : (column + 1);
        return { row: row, column: rightColumn };
    }

    getDownCell(row, column) {
        let downRow = row == (this.getNumRows() - 1) ? 0 : (row + 1);
        return { row: downRow, column: column };
    }

    handleStrategyAction(newField, row, column) {
        let isPlayer = this.isPlayer(this.getCellState(row, column));
        let action = isPlayer ? this.playerAction : this.enemyAction;
        switch (action) {
            case this.actions.moveLeft:
            case this.actions.moveUp:
            case this.actions.moveRight:
            case this.actions.moveDown: {
                newField[row][column].push(this.cellTypes.empty);

                let actionConfig = this.getActionConfig(action);
                let nextCoordinate = actionConfig.nextCoordinate(row, column);
                let resultState = isPlayer ? actionConfig.playerState : actionConfig.enemyState;
                newField[nextCoordinate.row][nextCoordinate.column].push(resultState);
                break;
            }
            case this.actions.fire: {
                let bulletConfig = this.getFireConfiguration(this.getCellState(row, column), row, column);
                newField[bulletConfig.row][bulletConfig.column].push(bulletConfig.cellType);
                newField[row][column].push(this.getCellState(row, column));
                break;
            }
            case this.actions.doNothing: {
                // well, do what it is said.
                newField[row][column].push(this.getCellState(row, column));
                break;
            }
            default: {
                alert("unknown action");
            }
        }
    }

    getActionConfig(action) {
        switch (action) {
            case this.actions.moveLeft: {
                return {
                    nextCoordinate: this.getLeftCell.bind(this),
                    playerState: this.cellTypes.playerLeft,
                    enemyState: this.cellTypes.enemyLeft,
                };
            }
            case this.actions.moveUp: {
                return {
                    nextCoordinate: this.getUpCell.bind(this),
                    playerState: this.cellTypes.playerUp,
                    enemyState: this.cellTypes.enemyUp,
                };
            }
            case this.actions.moveRight: {
                return {
                    nextCoordinate: this.getRightCell.bind(this),
                    playerState: this.cellTypes.playerRight,
                    enemyState: this.cellTypes.enemyRight,
                };
            }
            case this.actions.moveDown: {
                return {
                    nextCoordinate: this.getDownCell.bind(this),
                    playerState: this.cellTypes.playerDown,
                    enemyState: this.cellTypes.enemyDown,
                };
            }
        }
        alert("master, what have you done with that action!");
    }

    getFireConfiguration(cellState, row, column) {
        switch (cellState) {
            case this.cellTypes.playerLeft:
            case this.cellTypes.enemyLeft: {
                let coordinate = this.getLeftCell(row, column);
                return {
                    row: coordinate.row,
                    column: coordinate.column,
                    cellType: this.cellTypes.bulletLeft,
                }
            }
            case this.cellTypes.playerUp:
            case this.cellTypes.enemyUp: {
                let coordinate = this.getUpCell(row, column);
                return {
                    row: coordinate.row,
                    column: coordinate.column,
                    cellType: this.cellTypes.bulletLeft,
                }
            }
            case this.cellTypes.playerRight:
            case this.cellTypes.enemyRight: {
                let coordinate = this.getRightCell(row, column);
                return {
                    row: coordinate.row,
                    column: coordinate.column,
                    cellType: this.cellTypes.bulletRight,
                }
            }
            case this.cellTypes.playerDown:
            case this.cellTypes.enemyDown: {
                let coordinate = this.getDownCell(row, column);
                return {
                    row: coordinate.row,
                    column: coordinate.column,
                    cellType: this.cellTypes.bulletDown,
                }
            }
        }
        alert("master, what have you done with that fire direction!");
    }

    handleCollisions(newField) {
        for (let row = 0; row < this.getNumRows(); ++row) {
            for (let column = 0; column < this.getNumColumns(); ++column) {
                let result = newField[row][column];
                if (result.length < 2) {
                    continue;
                }

                result = result.filter(x => x != this.cellTypes.empty);
                if (result.length == 1) {
                    newField[row][column] = result;
                    continue;
                }

                if (result.every(x => this.isBullet(x))) {
                    newField[row][column] = [this.cellTypes.empty];
                    continue;
                }

                console.assert(result.length >= 2, "master, it can't be " + result);
                // Here we have mix of bullets, player and enemy.
                // Sort to handle player - enemy interaction first.
                result.sort((lhs, rhs) => { return lhs - rhs; });
                let firstActor = result[0];
                let secondActor = result[1];
                if (this.isPlayerBulletCollision(firstActor, secondActor)) {
                    return this.gameStates.Defeat;
                } else if (this.isEnemyBulletCollision(firstActor, secondActor)) {
                    return this.gameStates.Victory;
                } else if (this.isPlayerEnemyCollision(firstActor, secondActor)) {
                    return this.gameStates.Draw;
                }

                alert("master, I don't know what to do with that collision: " + result);
                throw new Error("unknown collision");
            }
        }

        return this.gameStates.InProgress;
    }

    createNewCollisionField() {
        let newField = new Array(this.getNumRows());
        for (let row = 0; row < this.getNumRows(); ++row) {
            newField[row] = new Array(this.getNumColumns());
            for (let column = 0; column < this.getNumColumns(); ++column) {
                newField[row][column] = new Array();
            }
        }
        return newField;
    }

    writeResultField(newField) {
        for (let row = 0; row < this.getNumRows(); ++row) {
            for (let column = 0; column < this.getNumColumns(); ++column) {
                this.field.setCell(row, column, newField[row][column][0]);
            }
        }
    }

    setupPlayer(row, column) {
        this.field.setCell(row, column, this.cellTypes.playerRight);
    }

    setupEnemy(row, column) {
        this.field.setCell(row, column, this.cellTypes.enemyLeft);
    }

    getCellState(row, column) { return this.field.getCell(row, column); }
    getNumRows() { return this.field.numRows; }
    getNumColumns() { return this.field.numColumns; }
}

class Field {
    constructor(buffer, offset, numRows, numColumns, sizeCellInBytes) {
        this.numRows = numRows;
        this.numColumns = numColumns;
        this.sizeCellInBytes = sizeCellInBytes;
        this.field = new Uint8Array(buffer, offset, numRows * numColumns * this.sizeCellInBytes);
    }

    copyTo(buffer, offset) {
        let fieldCopy = new Uint8Array(buffer, offset, this.numRows * this.numColumns * this.sizeCellInBytes);
        for (let row = 0; row < this.numRows; ++row) {
            for (let column = 0; column < this.numColumns; ++column) {
                fieldCopy[(row * this.numColumns + column) * this.sizeCellInBytes] = this.getCell(row, column);
            }
        }
    }

    getCell(row, column) {
        return this.field[(row * this.numColumns + column) * this.sizeCellInBytes];
    }

    setCell(row, column, value) {
        this.field[(row * this.numColumns + column) * this.sizeCellInBytes] = value;
    }
}