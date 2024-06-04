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
    if (index % 3 === 0) {
      gridData.push({
        text: `${index}`,
        bgColor: '9cdcf9',
        fontColor: '5E5A54',
        image: 'dairy_milk',
      });
    } else if (index % 2 === 0) {
      gridData.push({
        text: `${index}`,
        bgColor: '00aeef',
        fontColor: '5E5A54',
        image: 'rice_cake',
      });
    } else {
      gridData.push({
        text: `${index}`,
        bgColor: '01549d',
        fontColor: 'FFE4B8',
        image: 'truffle_lindt',
      });
    }
  }

  return gridData;
};

const getRandomIndex = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

module.exports = {
  getCompanyData,
  getAdjustedAngle,
  lerp,
  getFinishIndex,
  getRandomIndex,
};
