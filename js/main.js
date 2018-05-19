import styles from '../abirechner.css';

import App from 'app.js';

window.addEventListener('DOMContentLoaded', App.newFile);
$('#btn-newfile').click(e => { App.newFile(); });
$('#btn-openfile').click(e => { $('#filechooser-open').click(); });
$('#filechooser-open').on('change', App.openFile);
$('#btn-savefile').click(e => { App.saveFile(); });
