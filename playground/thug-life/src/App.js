import React, { Component } from 'react';
import './App.css';
import Script from 'react-load-script'
import 'tracking'
import 'tracking/build/data/face'
import 'tracking/build/data/eye'
import { Howl, Howler } from 'howler';

class App extends Component {

    tracker = null
    trackTask = null;
    analyzing = false;
    index = -1;
    thugIndex = -1;

    constructor(props) {
        super(props);
        this.state = {
            width: 0,
            height: 0,
            showGlass: false,
            glassWidth: 0
        }
    }

    componentDidMount() {
        this.tracker = new window.tracking.ObjectTracker(['face', 'eye']);
    }

    componentWillUnmount() {
        this.tracker.removeAllListeners()
    }

    render() {
        return (
            <div className="App" style={{ width: '100vw', height: '100vh', display: 'flex' }}>
                <Script
                    url="gifuct-js.js"
                />
                <Script
                    url="gifuct-js-extra.js"
                    onCreate={this.handleScriptCreate}
                    onError={this.handleScriptError}
                    onLoad={this.handleScriptLoad}
                />
                <div style={{ position: 'relative', width: this.state.width, height: this.state.height, margin: 'auto' }}>
                    <img id="glasses" style={{
                        display: this.state.showGlass ? 'block' : 'none',
                        left: this.state.glassLeft,
                        top: -100,
                        width: this.state.glassWidth
                    }} src="https://rawgit.com/ManzDev/cursos-assets/gh-pages/js/glasses.png" />
                    <canvas style={{ position: 'absolute', left: '0', top: '0', }} width={this.state.width} height={this.state.height} ref="input" id="c"></canvas>
                    <canvas style={{ position: 'absolute', left: '0', top: '0', }} width={this.state.width} height={this.state.height} ref="output" id="co"></canvas>
                </div>
            </div>
        );
    }

    handleScriptCreate = () => {
        this.setState({ scriptLoaded: false })
    }

    handleScriptError = () => {
        this.setState({ scriptError: true })
    }

    initializeTracker = () => {
        // this.tracker.setInitialScale(4);
        // this.tracker.setStepSize(2);
        // this.tracker.setEdgesDensity(0.1);
        var input = document.getElementById('c');
        this.trackTask = window.tracking.track(input, this.tracker);
        this.tracker.on('track', event => {
            let output = document.getElementById('co')
            let context = output.getContext('2d')
            context.clearRect(0, 0, output.width, output.height)
            if (this.analyzing) {
                event.data.forEach(function (rect) {
                    context.strokeStyle = '#a64ceb'
                    context.lineWidth = 2;
                    context.strokeRect(rect.x, rect.y, rect.width, rect.height)
                    context.font = '11px Helvetica'
                    context.fillStyle = "#fff"
                    context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11)
                    context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22)
                })
            }
            var glassWidth = 0;
            var glassLeft = 0;
            var glassTop = 0;
            if (event.data.some(outerRect => {
                var embedded = false;
                event.data.forEach(function (innerRect) {
                    if (innerRect.x + innerRect.width < outerRect.x + outerRect.width && innerRect.x > outerRect.x && innerRect.y > outerRect.y && innerRect.y + innerRect.height < outerRect.y + outerRect.height) {
                        embedded = true;
                        glassWidth = outerRect.width - (2 * (innerRect.x - outerRect.x));
                        if(glassWidth < 0) {
                            glassWidth = outerRect.width - (2 * (outerRect.x + outerRect.width - innerRect.x - innerRect.width));
                            glassLeft = outerRect.x + outerRect.x + outerRect.width - innerRect.x - innerRect.width;
                            glassTop = innerRect.y + innerRect.height/4;
                        }
                        else {
                            glassLeft = innerRect.x;
                            glassTop = innerRect.y + innerRect.height/4;
                        }
                    }
                });
                return embedded;
            })) {
                if (this.analyzing) {
                    this.thugIndex = this.index;
                }
                else if (this.thugIndex == this.index) {
                    /* thug-life moment 😎 */
                    // pause
                    playpause(); // eslint-disable-line
                    // grayscale
                    bGrayscale = true; // eslint-disable-line
                    renderPrevious(() => { }); // eslint-disable-line
                    // show glass and music
                    this.setState({
                        showGlass: true,
                        glassWidth: glassWidth,
                        glassLeft: glassLeft,
                    }, () => {
                        let glasses = document.getElementById('glasses')
                        let audio = new Howl({
                            src: ['https://manzdev.github.io/cursos-assets/js/thug-life.mp3'],
                            // loop: true
                        });
                        $('#glasses').animate({top: glassTop}); // eslint-disable-line
                        audio.play()
                    });
                }
            }
        });
    }

    handleScriptLoad = () => {
        this.setState({ scriptLoaded: true });
        fetch(`https://media.giphy.com/media/5n7wtufsvNTEJ8CCwR/giphy.gif`)
            .then(resp => resp.arrayBuffer())
            .then(buff => new GIF(buff)) // eslint-disable-line
            .then(gif => {
                var frames = gif.decompressFrames(true);
                this.analyzing = false;
                this.setState({
                    width: frames[0].dims.width,
                    height: frames[0].dims.height
                }, () => {
                    this.initializeTracker();
                    renderGIF(frames, (index) => { // eslint-disable-line
                        this.index = index;
                        if (index === 0) {
                            this.analyzing = !this.analyzing;
                            if (!this.analyzing) {
                                // clear
                                let output = document.getElementById('co')
                                let context = output.getContext('2d')
                                context.clearRect(0, 0, output.width, output.height)
                            }
                        }
                        if (this.trackTask && (this.analyzing || this.index === this.thugIndex)) {
                            this.trackTask.stop();
                            this.trackTask.run();
                        }
                    });
                });
            });
    }
}

export default App;