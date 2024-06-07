const { getStoreKey } = require('./store');
const { storeResults } = require('./firebase');

const getCompanyData = () => {
  const gridData = getGridData();
  const gridSkewY = 90 - 360 / gridData.length;
  const gridRotate = 360 / gridData.length;
  return {
    gridData,
    gridSkewY,
    gridRotate,
  };
};

const getGridData = () => {
  const num = Math.floor(Math.random() * (10 - 4 + 1)) + 4;
  const gridData = [];
  for (let index = 1; index <= num; index++) {
    switch (index % 3) {
      case 0:
        gridData.push({
          text: `${index}`,
          bgColor: '9cdcf9',
          fontColor: '5E5A54',
          image: 'dairy_milk',
        });
        break;
      case 1:
        gridData.push({
          text: `${index}`,
          bgColor: '00aeef',
          fontColor: '5E5A54',
          image: 'rice_cake',
        });
        break;
      case 2:
        gridData.push({
          text: `${index}`,
          bgColor: '01549d',
          fontColor: 'FFE4B8',
          image: 'truffle_lindt',
        });
        break;
    }
  }

  return gridData;
};

//  Linear interpolation function
const lerp = (start, end, t) => {
  return start * (1 - t) + end * t;
};

const getAdjustedAngle = (angle, gridRotate, isClockwise) => {
  const halfItemRotateDeg = gridRotate / 2;
  const stoppedAngle =
    isClockwise === true ? angle % 360 : ((angle % 360) + 360) % 360;
  let adjustment;
  if (isClockwise === true) {
    adjustment = halfItemRotateDeg - (stoppedAngle % gridRotate);
  } else {
    adjustment = (stoppedAngle % gridRotate) - halfItemRotateDeg;
    if (adjustment < 0) {
      adjustment += gridRotate;
    }
  }
  isClockwise === true ? (angle += adjustment + 360) : (angle -= adjustment);
  return angle;
};

const getFinishIndex = (isClockwise, rotateDeg, gridRotate) => {
  const stoppedAngle =
    isClockwise === true
      ? 360 - (rotateDeg % 360)
      : ((rotateDeg % 360) + 360) % 360;
  const index = stoppedAngle / gridRotate;

  return Math.floor(index);
};

const getGameResult = (firstAngle, secondAngle, gridData) => {
  const firstWheelFinishIndex = getFinishIndex(true, firstAngle, gridData.gridRotate);
  const secondWheelFinishIndex = getFinishIndex(false, secondAngle, gridData.gridRotate);
  const isIndexesMatch = firstWheelFinishIndex === secondWheelFinishIndex;
  const firstItem = gridData.items[firstWheelFinishIndex]
  const secondItem = gridData.items[secondWheelFinishIndex]
  const isColorsMatch = firstItem.bgColor === secondItem.bgColor;
  const isWinner = isIndexesMatch || isColorsMatch;
  let prizeType = null;
  if (isIndexesMatch) {
    prizeType = 'A'
  } else if (isColorsMatch) {
    prizeType = 'B'
  }
  const resultItem = isWinner ? firstItem : null;
  const result = {
    isWinner,
    resultItem,
    prizeType,
    firstWheelResult: firstItem.text,
    secondWheelResult: secondItem.text,
  };

  storeGameResult({ firstWheelFinishIndex, secondWheelFinishIndex, firstAngle, secondAngle, grid_rotate: gridData.gridRotate, isWinner, prizeType });

  return result;
};

const storeGameResult = (result) => {
  const startedAt = getStoreKey('startAt');
  const finishedAt = getStoreKey('finishAt');
  const userId = getStoreKey('userId');
  const companyId = getStoreKey('companyId');
  const gameId = getStoreKey('gameId');
  const { firstWheelFinishIndex, secondWheelFinishIndex, firstAngle, secondAngle, grid_rotate, isWinner, prizeType } = result

  const storeResult = {
    companyId: companyId,
    finish_angle_1: firstAngle,
    finish_angle_2: secondAngle,
    finish_index_1: firstWheelFinishIndex,
    finish_index_2: secondWheelFinishIndex,
    finishedAt: finishedAt,
    gameId: gameId,
    grid_rotate: grid_rotate,
    isWinner: isWinner,
    prize_type: prizeType,
    startedAt: startedAt,
    userId: userId,
  }

  storeResults(storeResult);
}

module.exports = { getCompanyData, getAdjustedAngle, lerp, getFinishIndex, getGameResult };
