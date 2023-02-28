﻿window.onpopstate = function(event) {
    let path = document.location.pathname;
    path = path.substring(path.lastIndexOf('/') + 1);
    fetchDashboard(path, true);
}

function abortRequests() {
    let uid = this.getDashboardInstanceUid();
    let event = new CustomEvent("disposeDashboard", 
        {
            detail: {
                uid: uid,
            },
            bubbles: true,
            cancelable: true
        }
    );
    document.body.dispatchEvent(event);
}


function getDashboardInstanceUid()
{
    return document.getElementById('dashboard-instance')?.value;
}


function LiveApp(name, instanceUid, interval) 
{    
    if(typeof(name) !== 'string')
        throw 'Name is not a string';

    new SmartApp({
        name: name,
        uid: instanceUid,
        interval: interval,
    });
}

function changeTheme(theme) {
    if (!theme)
        return;
    document.getElementById('theme-style').setAttribute('href', `/themes/${theme}/theme.css`);
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function fetchDashboard(uid,  backwards) {
    let currentTheme = document.getElementById('hdn-dashboard-theme')?.value || 'Default';
    let fetchUrl = '/dashboard/' + (uid || 'Default') + '?inline=true';
    fetch(fetchUrl).then(res => {
        if(!res.ok)
            return;
        this.abortRequests();
        return res.text();        
    }).then(html => {
        html = html.replace(/x-text=\"[^"]+\"/g, '');
        if(!backwards)
            history.pushState({uid:uid}, 'Fenrus', '/dashboard/' + uid);

        let eleDashboard = document.querySelector('.dashboard');
        eleDashboard.innerHTML = html;
        if(typeof(themeInstance) !== 'undefined')
            themeInstance.init();

        let dashboardBackground = document.getElementById('hdn-dashboard-background')?.value || null;       
        document.body.style.backgroundImage = dashboardBackground ? `url('${dashboardBackground}')` : null;
        document.body.classList.remove('custom-background');
        document.body.classList.remove('no-custom-background');
        document.body.classList.add((!dashboardBackground ? 'no-' : '') + 'custom-background');

        let dashboardTheme = document.getElementById('hdn-dashboard-theme')?.value || 'Default';
        if(currentTheme != dashboardTheme)
            changeTheme(dashboardTheme);


        let name = document.getElementById('hdn-dashboard-name').value;
        document.getElementById('dashboard-name').innerText = name === 'Default' ? '' : name;

        let rgx = /LiveApp\('([^']+)', '([^']+)', ([\d]+)\);/g;
        let count = 0;
        while (match = rgx.exec(html)){
          let name = match[1];
          let uid = match[2];
          let interval = parseInt(match[3], 10);
          LiveApp(name, uid, interval);

          if(++count > 100) // avoid infinite while loop, shouldnt happen, but safety first
            break;
        }
    });
}

function launch(event, uid) {
    abortRequests();
    if(event && event.ctrlKey)
        return;
    let divLaunchingApp = document.getElementById('launching-app');
    let eleApp = document.getElementById(uid);    
    if(eleApp && divLaunchingApp){
        let target = eleApp.getAttribute('target');
        if(!target || target === '_self'){
            divLaunchingApp.querySelector('.title').textContent = 'Launching ' + eleApp.querySelector('.content .title').textContent;
            divLaunchingApp.querySelector('img').src = eleApp.querySelector('.icon img').src;
            divLaunchingApp.style.display = 'unset';
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) {
    let divLaunchingApp = document.getElementById('launching-app');
    if(divLaunchingApp)
        divLaunchingApp.style.display = 'none';
});

function changeDashboard(uid){    
    document.cookie = 'dashboard=' + uid + '; expires=Tue, 19 Jan 2038 04:14:07 GMT';
    window.location.reload(true);
}

function moveGroup(groupUid, up){
    let dashboardUid = document.querySelector('.dashboard').getAttribute('x-uid');
    fetch(`/settings/dashboards/${dashboardUid}/move-group/${groupUid}/${up}`, { method: 'POST'}).then(res => {
        let eleGroup = document.getElementById(groupUid);
        let dashboard = eleGroup.parentElement;
        let groups = dashboard.querySelectorAll('.db-group');
        let grpIndex = Array.prototype.indexOf.call(groups, eleGroup);
        let first, second;
        if(up){
            first = eleGroup;
            second = groups[grpIndex - 1];
        }else{
            first = groups[grpIndex + 1];
            second = eleGroup;
        }
        dashboard.insertBefore(first, second);
    });
}

function removeGroup(groupUid, groupName) 
{
    if(confirm(`Do you want to remove the group '${groupName}'?`) !== true)
        return;
    let dashboardUid = document.querySelector('.dashboard').getAttribute('x-uid');        
    fetch(`/settings/dashboards/${dashboardUid}/remove-group/${groupUid}`, { method: 'POST'}).then(res => {
        let eleGroup = document.getElementById(groupUid);
        eleGroup?.remove();
    });
}

function UpdateSetting(setting, event)
{
    if(setting === 'Dashboard'){
        changeDashboard(event);
        return;
    }
    UpdateSettingValue(`/settings/update-setting/${setting}/#VALUE#`, event);
}

function UpdateDashboardSetting(setting, event)
{
    let uid = document.querySelector('div.dashboard[x-uid]').getAttribute('x-uid');
    if(!uid)
        return;
    
    UpdateSettingValue(`/settings/dashboard/${uid}/update-setting/${setting}/#VALUE#`, event);
}

function ChangeBackgroundColor(event, color){
    if(window.BackgroundInstance?.changeBackgroundColor)
        window.BackgroundInstance?.changeBackgroundColor(color);
    UpdateDashboardSetting('BackgroundColor', color);
}
function ChangeAccentColor(event, color){
    document.body.style.setProperty('--accent', color);
    UpdateDashboardSetting('AccentColor', color);
    if(window.BackgroundInstance?.changeAccentColor)
        window.BackgroundInstance?.changeAccentColor(color);
}
function ChangeBackground(event){
    let background = event;
    if(typeof(background) !== 'string') {
        let index = background.target.selectedIndex;
        background = background.target.options[index].value;
    }
    
    let bkgSrc = '/backgrounds/' + background;

    let backgroundScript = document.getElementById('background-script');
    if(backgroundScript) {
        // check if its the same background
        if(backgroundScript.getAttribute('src') === bkgSrc)
            return; // same background, nothing to do 
        
        backgroundScript.remove();
    }
    
    if(window.BackgroundInstance?.dispose) {
        window.BackgroundInstance.dispose();
        delete Background;
    }
        
    InitBackground(background);
    UpdateDashboardSetting('Background', event);
}

var loadedBackgrounds = {};
function InitBackground(background){
    if(!background)
        return;
    
    let bkgSrc = '/backgrounds/' + background;
    
    if(typeof(loadedBackgrounds[bkgSrc]) === 'function'){
        window.BackgroundInstance = new loadedBackgrounds[bkgSrc]();
        window.BackgroundInstance.init();
        return;
    }
        
    let backgroundScript = document.createElement('script');
    backgroundScript.setAttribute('id', 'background-script');
    backgroundScript.onload = () => {
        loadedBackgrounds[bkgSrc] = window.BackgroundType;
        window.BackgroundInstance = new window.BackgroundType();
        window.BackgroundInstance.init();
    };
    backgroundScript.setAttribute('src', bkgSrc);
    document.head.append(backgroundScript);
}

function UpdateThemeSetting(theme, setting, event)
{
    let value = UpdateSettingValue(`/settings/theme/${theme}/update-setting/${setting}/#VALUE#`, event);
    if(value === undefined)
        return;

    themeInstance.settings[setting] = value;
    if(themeInstance.init)
        themeInstance.init();
}

function UpdateSettingValue(url, event)
{
    if(event?.target?.className === 'slider round')
        return;
    let value = event;
    if(event?.target?.tagName === 'SELECT')
    {
        let index = event.target.selectedIndex;
        value = event.target.options[index].value;
    }
    else if(event?.target?.tagName === 'INPUT' && event.target.type === 'checkbox')
        value = event.target.checked;
    else if(event?.target?.tagName === 'INPUT' && event.target.type === 'range') {
        value = event.target.value;
        let min = parseInt(event.target.getAttribute('min'), 10);
        let max = parseInt(event.target.getAttribute('max'), 10);
        let percent = (value - min) / (max - min) * 100;
        event.target.style = `background-size: ${percent}% 100%`;
        let rangeValue = event.target.parentNode.querySelector('.range-value');
        if(rangeValue)
            rangeValue.textContent = value;
    }
    url = url.replace('#VALUE#', encodeURIComponent(value));
    fetch(url, { method: 'POST'}).then(res => {
        return res.json();
    }).then(json => {
        if(json.reload) {
            window.location.reload();
            return;
        }

        let eleDashboard = document.querySelector('.dashboard');
        eleDashboard.classList.remove('hide-group-titles');
        if(json.showGroupTitles === false)
            eleDashboard.classList.add('hide-group-titles');

        eleDashboard.classList.remove('status-indicators');
        if(json.showStatusIndicators === true)
            eleDashboard.classList.add('status-indicators');

        if(json.linkTarget){
            // need to update all the targets
            for(let a of eleDashboard.querySelectorAll('a'))
            {
                if(a.getAttribute('href').length > 1)
                    a.setAttribute('target', json.linkTarget);
            }
        }
    });
    return value;
}

function shadeColor(color, percent) {

    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R<255)?R:255;
    G = (G<255)?G:255;
    B = (B<255)?B:255;

    R = Math.round(R)
    G = Math.round(G)
    B = Math.round(B)

    let RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    let GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    let BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}