import express from 'express';

import { log } from './utils';
import { reportsList, generateReport } from './modules/reports';

const Slack = require('slack-node');

const router = new express.Router();

router.post('/slack/events/eransh', async (req, res) => {
  try {
    const slackReqObj = req.body;

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello bra',
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/events/catchEvent', async (req, res) => {
  try {
    const slackReqObj = req.body;

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Did something cause event fired',
      challenge: req.body.challenge,
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.post('/slack/command/getReportFile', async (req, res) => {
  try {
    const slackReqObj = req.body;

    const response = {
      response_type: 'in_channel',
      channel: slackReqObj.channel_id,
      text: 'Hello :slightly_smiling_face:',
      attachments: [{
        text: 'What nose would you like to get?',
        fallback: 'What nose would you like to get?',
        color: '#2c963f',
        attachment_type: 'default',
        callback_id: 'report_selection',
        actions: [{
          name: 'reports_select_menu',
          text: 'Pick a nose',
          type: 'select',
          options: reportsList,
        }],
      }],
    };

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

function sendMsg(channel, text, slack) {
  try {
    slack.api('chat.postMessage', {
      text,
      channel,
    });
  } catch (err) {
    console.log(err);
  }
}

function getCommitMessage(commit) {
  return `Hey! ${commit.committer.name} is in need of a code review, Are you brave enough?\n${commit.url}`;
}

router.post('/slack/actions', async (req, res) => {
  try {
    const slackReqObj = JSON.parse(req.body.payload);
    let response;

    if (slackReqObj.callback_id === 'report_selection') {
      response = await generateReport({ slackReqObj });
    }

    return res.json(response);
  } catch (err) {
    log.error(err);
    return res.status(500).send('Something blew up. We\'re looking into it.');
  }
});

router.all('/slack/actions/nachschons', async (req, res) => {

  const slack = new Slack('xoxp-360464771431-360309249750-394514050788-54bfa811243b08d20fc7a57b17e20d16');

  req.body.commits.forEach((commit) => {
    if (/(^|\|)client-review(\||$)/.test(commit.message)) {
      sendMsg('#client', getCommitMessage(commit), slack);
      console.log('client - message :: ', commit.message);
      console.log('client :: ', commit.url);
    } else if (/(^|\|)server-review(\||$)/.test(commit.message)) {
      sendMsg('#server', getCommitMessage(commit), slack);
      console.log('server - message :: ', commit.message);
      console.log('server :: ', commit.url);
    } else {
      console.log('message :: ', commit.message);
      sendMsg('#server', `${commit.committer.name} forgot to code review, let's all laugh at him :rolling_on_the_floor_laughing: `, slack);
      sendMsg('#client', `${commit.committer.name} forgot to code review, let's all laugh at him :rolling_on_the_floor_laughing: `, slack);
      console.log('ignore :: ', commit.message);
    }
  });

  return res.status(200).send('hell yeah');
});

export default router;
