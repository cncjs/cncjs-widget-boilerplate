import {
    IMPERIAL_UNITS,
    METRIC_UNITS
} from '../constants';

// from mm to in
const mm2in = (val = 0) => val / 25.4;

// from in to mm
const in2mm = (val = 0) => val * 25.4;

const toFixedUnits = (units, val) => {
    val = Number(val) || 0;
    if (units === IMPERIAL_UNITS) {
        val = mm2in(val).toFixed(4);
    }
    if (units === METRIC_UNITS) {
        val = val.toFixed(3);
    }

    return val;
};

export {
    mm2in,
    in2mm,
    toFixedUnits
};
