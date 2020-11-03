const config = require('config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('_helpers/db');
const User = db.User;

module.exports = {
    authenticate,
    createec2,
    getAll,
    getById,
    create,
    update,
    listInstances,
    runSSMCommand,
    delete: _delete
};

async function authenticate({ username, password }) {
    console.log('########')
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.hash)) {
        const token = jwt.sign({ sub: user.id }, config.secret, { expiresIn: '7d' });
        return {
            ...user.toJSON(),
            token
        };
    }
}

function createec2(ec2Data) {
    let arn = ec2Data.arn;
    let regionParam = ec2Data.region;
    let KeyName = ec2Data.keyName;
    let instanceType = ec2Data.instanceType;
    let amiId = ec2Data.amiId;
    let externalId = ec2Data.externalId;
    let instanceName = ec2Data.name;
    return new Promise(function(resolve, reject){ //Or Q.defer() in Q
        var AWS = require('aws-sdk');
        var sts = new AWS.STS({apiVersion: '2011-06-15'});
        //var sleep = require('system-sleep');
        //arn = 'arn:aws:iam::400525531427:role/react-node';
        console.log(arn);
        var params = {
            DurationSeconds: 3600,
            ExternalId: externalId,
            RoleArn: arn,
            RoleSessionName: 'reactNode'
           };
           sts.assumeRole(params, async function(err, data) {
            if(err){
                console.log('>>>>>>>> error in assume role');
                reject(err);
            }else{
                console.log('credentials obtained********');
                creds = new AWS.Credentials({
                      accessKeyId: data.Credentials.AccessKeyId, 
                      secretAccessKey: data.Credentials.SecretAccessKey,
                      sessionToken: data.Credentials.SessionToken
                });
                var ec2Creds = {
                                apiVersion: '2016-11-15',
                                region : regionParam,
                                credentials : creds
                };
                // let imageId = 'ami-0e306788ff2473ccb';
                // if(regionParam == 'ap-south-1') {
                //     console.log(imageId);
                // } else if (regionParam == 'us-east-1'){
                //     imageId = 'ami-0947d2ba12ee1ff75';
                //     console.log(imageId);
                // } else {
                //     console.log(imageId);
                // }
                var instanceParams = {
                    ImageId: amiId, 
                    InstanceType: instanceType,
                    KeyName: KeyName,
                    MinCount: 1,
                    MaxCount: 1
                };
    
                // Create a promise on an EC2 service object
                var instancePromise = new AWS.EC2(ec2Creds).runInstances(instanceParams).promise();
    
                // Handle promise's fulfilled/rejected states
                return await instancePromise.then(
                    function(data) {
                        var instanceId = data.Instances[0].InstanceId;
                        console.log("Created instance", instanceId);
                        // Add tags to the instance
                        tagParams = {Resources: [instanceId], Tags: [
                            {
                                Key: 'Name',
                                Value: instanceName
                            }
                        ]};
                        // Create a promise on an EC2 service object
                        var tagPromise = new AWS.EC2(ec2Creds).createTags(tagParams).promise();
                        // Handle promise's fulfilled/rejected states
                        tagPromise.then(
                            function(dataTag) {
                                console.log("Instance tagged", dataTag, instanceId);
                                resolve(data.Instances[0])
                            }).catch(
                            function(err) {
                                console.error(err, err.stack);
                                reject(err);
                            });
                    }).catch(
                    function(err) {
                    console.error(err, err.stack);
                    reject(err);
                    });
            }
         });
    
    });
}


function listInstances(listData) {
    let arn = listData.arn;
    let regionParam = listData.region;
    let instanceType = listData.instanceType;
    let externalId = listData.externalId;
    return new Promise(function(resolve, reject){ //Or Q.defer() in Q
        console.log('%%%%%%%%%%%')
        var AWS = require('aws-sdk');
        var sts = new AWS.STS({apiVersion: '2011-06-15'});
        //var sleep = require('system-sleep');
        // arn = 'arn:aws:iam::400525531427:role/react-node';
        console.log(arn);
        var params = {
            DurationSeconds: 3600,
            ExternalId: externalId,
            RoleArn: arn,
            RoleSessionName: 'reactNode'
           };
           sts.assumeRole(params, async function(err, data) {
            if(err){
                console.log('>>>>>>>> error in assume role', err);
                reject(err);
            }else{
                console.log('credentials obtained********');
                creds = new AWS.Credentials({
                      accessKeyId: data.Credentials.AccessKeyId, 
                      secretAccessKey: data.Credentials.SecretAccessKey,
                      sessionToken: data.Credentials.SessionToken
                });
                var ec2Creds = {
                                apiVersion: '2016-11-15',
                                region : regionParam,
                                credentials : creds
                };
                console.log('$$$$$$$$$$$$$ec2Cred', ec2Creds);
                var params = {
                    Filters: [
                       {
                      Name: "instance-type", 
                      Values: [
                        instanceType
                      ]
                     }
                    ]
                   };
    
                // Create a promise on an EC2 service object
                var instancePromise = await new AWS.EC2(ec2Creds).describeInstances(params).promise();
                console.log(instancePromise);
                resolve(instancePromise);
            }
         });
    
    });
}

function runSSMCommand(cmdData) {
    console.log(cmdData)
    let arn = cmdData.arn;
    let regionParam = cmdData.region;
    let instanceId = cmdData.instanceId;
    let externalId = cmdData.externalId;
    let command = cmdData.command;
    return new Promise(function(resolve, reject){ //Or Q.defer() in Q

        var script_string = command.replace(/\n/g, ",");  
        var command_array = script_string.split(",");
        var AWS = require('aws-sdk');

        var sts = new AWS.STS({apiVersion: '2011-06-15'});
        //var sleep = require('system-sleep');
        arn = 'arn:aws:iam::400525531427:role/react-node';
        console.log(arn);
        var params = {
            DurationSeconds: 3600,
            ExternalId: externalId,
            RoleArn: arn,
            RoleSessionName: 'reactNode'
           };
           sts.assumeRole(params, async function(err, data) {
            if(err){
                console.log('>>>>>>>> error in assume role', err);
                reject(err)
            }else{
                console.log('credentials obtained********');
                creds = new AWS.Credentials({
                      accessKeyId: data.Credentials.AccessKeyId, 
                      secretAccessKey: data.Credentials.SecretAccessKey,
                      sessionToken: data.Credentials.SessionToken
                });

                
                var ssm = new AWS.SSM({
                    apiVersion: '2014-11-06',
                    region : regionParam,
                    credentials : creds
                });
                var params2 = {
                    DocumentName: 'AWS-RunShellScript',
                    InstanceIds: [
                       instanceId
                    ],
                    Parameters: { "commands":command_array }
                };    
                console.log(params2)
                
                // Create a promise on an EC2 service object
                // var ssmPromise = await ssm.sendCommand(params).promise();
                // console.log(ssmPromise);
                // resolve(ssmPromise);

                ssm.sendCommand(params2, function(err, data){
                    if(err){
                        console.log('ERROR---------- SSM=======> ', instanceId, err);  
                        reject(err);  
                    }else{
                       sleep(1000, function() {});
                       var params1 = {
                        CommandId: data.Command.CommandId,
                        InstanceId: instanceId
                      };

                    ssm.getCommandInvocation(params1, function(err, data1){
                        if(err){
                            reject(err)
                        } else {
                            console.log('%%%%%%%', data1);
                            resolve(data1);
                        //     if(req.body.script=="clear"){
                        //         data1.StandardOutputContent="";
                        //    }
                        //    if(req.body.script!="clear" && data1.StandardOutputContent==""){
                        //        var output = "Result for instance id "+instanceId+"\n"+data1.StandardErrorContent+"\n";
                        //    }else{
                        //        var output = "Result for instance id "+instanceId+"\n"+data1.StandardOutputContent+"\n";
                        //    }
                        }                    
                        
                    });
                    }       
                });
                // Create a promise on an EC2 service object
                // var instancePromise = await new AWS.EC2(ec2Creds).describeInstances(params).promise();
                // console.log(instancePromise);
                // resolve(instancePromise);
            }
         });
    });
}

async function getAll() {
    return await User.find();
}

async function getById(id) {
    return await User.findById(id);
}

async function create(userParam) {
    // validate
    if (await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    const user = new User(userParam);

    // hash password
    if (userParam.password) {
        user.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // save user
    await user.save();
}

async function update(id, userParam) {
    const user = await User.findById(id);

    // validate
    if (!user) throw 'User not found';
    if (user.username !== userParam.username && await User.findOne({ username: userParam.username })) {
        throw 'Username "' + userParam.username + '" is already taken';
    }

    // hash password if it was entered
    if (userParam.password) {
        userParam.hash = bcrypt.hashSync(userParam.password, 10);
    }

    // copy userParam properties to user
    Object.assign(user, userParam);

    await user.save();
}

async function _delete(id) {
    await User.findByIdAndRemove(id);
}

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}