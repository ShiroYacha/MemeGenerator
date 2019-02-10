import React, { Component } from 'react';
import './App.css';
import Script from 'react-load-script'
import 'tracking'
import 'tracking/build/data/face'
import 'tracking/build/data/eye'
import { Howl, Howler } from 'howler';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

class App extends Component {

    tracker = null
    trackTask = null;
    analyzing = false;
    index = -1;
    thugIndex = -1;
    runs = 0;

    constructor(props) {
        super(props);
        this.state = {
            width: 0,
            height: 0,
            showGlass: false,
            glassWidth: 0,
            url: null,
            running: false,
            message: '',
            sharable: false
        }
    }

    componentDidMount() {
        this.tracker = new window.tracking.ObjectTracker(['face', 'eye']);
    }

    componentWillUnmount() {
        this.tracker.removeAllListeners()
    }

    handleUrlChange = (value) => {
        this.setState({ url: value.target.value });
    }

    handleGenerateClick = () => {
        // clear
        let output = document.getElementById('co')
        let context = output.getContext('2d')
        context.clearRect(0, 0, output.width, output.height);
        if (this.trackTask) {
            this.trackTask.stop();
        }
        this.thugIndex = -1;
        playing = false;// eslint-disable-line
        bInvert = false;// eslint-disable-line
        bGrayscale = false;// eslint-disable-line
        loadedFrames = null;// eslint-disable-line
        frameIndex = 0;// eslint-disable-line
        this.setState({
            width: 0,
            height: 0,
            showGlass: false,
            glassWidth: 0,
            running: true,
            message: ''
        }, () => {
            // fetch
            this.runs = 0;
            fetch(this.state.url)
                .then(resp => {
                    if (resp.ok) {
                        return resp.arrayBuffer();
                    }
                    else {
                        this.setState({ message: 'Error processing URL 🤔', running: false })
                        return Promise.reject();
                    }
                })
                .catch(error => {
                    this.setState({ message: 'Error processing URL 🤔', running: false })
                })
                .then(buff => {
                    return new GIF(buff);  // eslint-disable-line
                })
                .catch(error => {
                    this.setState({ message: 'Error processing URL 🤔', running: false })
                })
                .then(gif => {
                    var frames = gif.decompressFrames(true);
                    this.analyzing = false;
                    if (frames.length === 0) {
                        this.setState({ message: 'Error processing URL 🤔', running: false });
                        return;
                    };
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
                            if (index === frames.length - 1) {
                                this.runs++;
                                if (this.runs === 1 && this.thugIndex === -1) {
                                    // stops
                                    this.trackTask.stop();
                                    playing = false; // eslint-disable-line
                                    this.setState({ running: false, message: 'Sorry I am not smart enough to process this GIF at the moment 😭' })
                                }
                            }
                        });
                    });
                });
        });
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
                <div style={{ margin: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', marginBottom: 10 }}>
                        <TextField id="url" value={this.state.url} onChange={this.handleUrlChange} type="url" style={{ width: '30vw', height: 50 }} variant='outlined' placeholder='Paste a GIF URL ...' />
                        <Button disabled={!this.state.url || !this.state.scriptLoaded || this.state.running} onClick={this.handleGenerateClick} variant="contained" color="primary" aria-label="Generate" style={{ marginLeft: 10, height: 50 }}>
                            <span style={{ fontSize: 20, marginRight: 5, marginTop: 5 }}>😎</span>
                            GO
                        </Button>
                        <Button disabled={!this.state.sharable} onClick={this.handleGenerateClick} variant="contained" color="primary" aria-label="Generate" style={{ marginLeft: 10, height: 50 }}>
                            <span style={{ fontSize: 20, marginRight: 5, marginTop: 5 }}>🔗</span>
                            Share
                        </Button>
                    </div>
                    <span style={{ color: 'red', textAlign: 'start', marginBottom: 10 }}>{this.state.message}</span>
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
            var detectFaceAndOneEye = (data) => {
                const eyeYPositionThreshold = 0.5;
                return data.some(outerRect => {
                    var embedded = false;
                    data.forEach(function (innerRect) {
                        if (/* Embedding */
                            innerRect.x + innerRect.width < outerRect.x + outerRect.width && innerRect.x > outerRect.x && innerRect.y > outerRect.y && innerRect.y + innerRect.height < outerRect.y + outerRect.height &&
                            /* Eye positioning can't be too low */
                            (innerRect.y - outerRect.y)/outerRect.height < eyeYPositionThreshold
                        ) {
                            embedded = true;
                            glassWidth = outerRect.width - (2 * (innerRect.x - outerRect.x));
                            if (glassWidth < 0) {
                                glassWidth = outerRect.width - (2 * (outerRect.x + outerRect.width - innerRect.x - innerRect.width));
                                glassLeft = outerRect.x + outerRect.x + outerRect.width - innerRect.x - innerRect.width;
                                glassTop = innerRect.y + innerRect.height / 4;
                            }
                            else {
                                glassLeft = innerRect.x;
                                glassTop = innerRect.y + innerRect.height / 4;
                            }
                        }
                    });
                    return embedded;
                })
            };
            var detectTwoEyes = (data) => {
                const sizeDiffTolerance = 0.1;
                const yDiffTolerance = 1;
                return data.some(leftRect => {
                    var embedded = false;
                    data.forEach(function (rightRect) {
                        if (/* Size of both rectangles must be similar*/
                            (leftRect.width - rightRect.width) / leftRect.width < sizeDiffTolerance && (leftRect.height - rightRect.height) / leftRect.height < sizeDiffTolerance &&
                            /* Vertical position of both rectangles must be similar */
                            Math.abs(leftRect.y - rightRect.y) / leftRect.height < yDiffTolerance 
                            /* Left vs. right */
                            && leftRect.x < rightRect.x
                        ) {
                            embedded = true;
                            glassWidth = rightRect.x + rightRect.width - leftRect.x;
                            glassTop = (leftRect.y + leftRect.height/3 + rightRect.y + rightRect.height/3) / 2; // not supporting rotation yet
                            glassLeft = leftRect.x;
                        }
                    });
                    return embedded;
                })
            }
            if (detectFaceAndOneEye(event.data) || detectTwoEyes(event.data)) {
                if (this.analyzing) {
                    this.thugIndex = this.index;
                }
                else if (this.thugIndex == this.index) {
                    /* thug-life moment 😎 */
                    // pause
                    playing = false; // eslint-disable-line
                    this.trackTask.stop();
                    // grayscale
                    bGrayscale = true; // eslint-disable-line
                    renderPrevious(() => { }); // eslint-disable-line
                    // show glass and music
                    this.setState({
                        showGlass: true,
                        glassWidth: glassWidth,
                        glassLeft: glassLeft,
                        running: false
                    }, () => {
                        let glasses = document.getElementById('glasses')
                        let audio = new Howl({
                            src: ['thug-life.mp3'],
                            // loop: true
                        });
                        $('#glasses').css({ top: -100 }); // eslint-disable-line
                        $('#glasses').animate({ top: glassTop }); // eslint-disable-line
                        audio.play()
                    });
                }
            }
        });
    }

    handleScriptLoad = () => {
        this.setState({ scriptLoaded: true });
    }
}

export default App;