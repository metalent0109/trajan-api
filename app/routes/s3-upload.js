let AWS = require('aws-sdk')

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION,
  signatureVersion: 'v4'
})

let s3 = new AWS.S3()

module.exports = (router) => {

  router.post('/', async (req, res) => {

    if (!req.body.file_name) {
      return res.status(400).send({ messge: 'No file name sent', success: false });
    }

    if (!req.body.file_type) {
      return res.status(400).send({ messge: 'No file tyoe sent', success: false })
    }

    var params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${Date.now()}/${req.body.file_name.split(' ').join('_')}`,
      ACL: 'public-read',
      ContentType: req.body.file_type
    }

    try {
      var signedUrl = await s3.getSignedUrl('putObject', params)
    } catch (error) {
      console.error(error)
      return res.status(500).send(error)
    }

    return res.json({ signedUrl })
  })

  return router
}
