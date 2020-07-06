const fetch = require('node-fetch');
const moment = require('moment');
const apiUrl = require('../helpers/apiUrl');

// LIST ALL TYPES.
exports.type_list = async function(req, res, next) {
    const data = await fetch(`${apiUrl}/types`, {
        method: 'GET',
        headers: {
            cookie: req.headers.cookie,
        }
    });
    const types = await data.json();

    var viewData = {
        title: 'All types',
        page: 'typePage',
        display: 'typeList',
        parent: 'Dashboard',
        parentUrl: '/dashboard',
        types: types.data,
        user: req.user,
        moment: moment,
        layout: 'layouts/main'
    }
    res.render('pages/index', viewData);
    console.log("Types list renders successfully");
};

// READ ONE TYPE.
exports.type_detail = async function(req, res, next) {
    var id = req.params.type_id;
    const data = await fetch(`${apiUrl}/type/${id}`, {
        method: 'GET',
        headers: {
            cookie: req.headers.cookie,
        }
    });
    const type = await data.json();
    console.log('this is type ' + type);

    var viewData = {
        title: 'Type Details',
        page: 'typePage',
        display: 'typeDetail',
        parent: 'Type List',
        parentUrl: '/types',
        type: type.data,
        id: id,
        user: req.user,
        moment: moment,
        layout: 'layouts/main'
    }
    res.render('pages/index', viewData);
    console.log("Type details renders successfully");
};

 