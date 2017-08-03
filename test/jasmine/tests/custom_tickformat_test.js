var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Axes = require('@src/plots/cartesian/axes');
var Fx = require('@src/components/fx');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var selectButton = require('../assets/modebar_button');
var constants = require('@src/constants/numerical');

var mock = require('@mocks/custom_tickformat.json');
var tickFormat = mock.layout.xaxis.tickformat;

function getZoomInButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomIn2d');
}

function getZoomOutButton(gd) {
    return selectButton(gd._fullLayout._modeBar, 'zoomOut2d');
}

function getFormatter(dtick) {
    var unit = '';
    if(typeof dtick === 'string') {
        if(Number(dtick.replace('M', '')) > 6) {
            unit = 'year';
        } else if(Number(dtick.replace('M', '')) >= 1) {
            unit = 'month';
        }
    } else if(dtick >= constants.ONEDAY * 7) {
        unit = 'week';
    } else if(dtick >= constants.ONEDAY) {
        unit = 'day';
    } else if(dtick >= constants.ONEHOUR) {
        unit = 'hour';
    } else if(dtick >= constants.ONEMIN) {
        unit = 'minute';
    } else if(dtick >= constants.ONESEC) {
        unit = 'second';
    } else if(dtick >= 0) {
        unit = 'millisecond';
    }
    if(tickFormat[unit]) {
        return d3.time.format.utc(tickFormat[unit]);
    }
    return function(mock) {return mock;};
}

describe('Test extended tickformat:', function() {

    var mockCopy, gd;

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    it('Zooming-in until milliseconds zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var zoomIn = function() {
            promise = promise.then(function() {
                getZoomInButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(gd._fullLayout.xaxis.dtick);
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                if(gd._fullLayout.xaxis.dtick > 1) {
                    zoomIn();
                } else {
                    done();
                }
            });
        };
        zoomIn();
    });

    it('Zooming-out until years zoom level', function(done) {
        var promise = Plotly.plot(gd, mockCopy.data, mockCopy.layout);

        var zoomOut = function() {
            promise = promise.then(function() {
                getZoomOutButton(gd).click();
                var xLabels = Axes.calcTicks(gd._fullLayout.xaxis);
                var formatter = getFormatter(gd._fullLayout.xaxis.dtick);
                var expectedLabels = xLabels.map(function(d) {return formatter(new Date(d.x));});
                var actualLabels = xLabels.map(function(d) {return d.text;});
                expect(expectedLabels).toEqual(actualLabels);
                if(typeof gd._fullLayout.xaxis.dtick === 'number' ||
                    typeof gd._fullLayout.xaxis.dtick === 'string' && parseInt(gd._fullLayout.xaxis.dtick.replace(/\D/g, '')) < 48) {
                    zoomOut();
                } else {
                    done();
                }
            });
        };
        zoomOut();
    });

    describe('Check tickformat for hover', function() {
        'use strict';

        var evt = { xpx: 270, ypx: 10 };

        afterEach(destroyGraphDiv);

        beforeEach(function() {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
        });

        it('tickformat for hover and xaxes should coincide', function(done) {
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                Fx.hover(gd, evt, 'xy');

                var hoverTrace = gd._hoverdata[0];
                var formatter = getFormatter(gd._fullLayout.xaxis.dtick);

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(3);
                expect(hoverTrace.x).toEqual('2010-01-04');
                expect(hoverTrace.y).toEqual(7);

                expect(d3.selectAll('g.axistext').size()).toEqual(1);
                expect(d3.selectAll('g.hovertext').size()).toEqual(1);
                expect(d3.selectAll('g.axistext').select('text').html()).toEqual(formatter(new Date(hoverTrace.x)));
                expect(d3.selectAll('g.hovertext').select('text').html()).toEqual('7');
                done();
            });
        });
    });

});
