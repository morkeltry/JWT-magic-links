const emailContent = ( email, link, options )=> {
  const { user } = options;
  if (!link) {
    const e = new Error ('No magic link to send');
    e.code = 500;
    throw e
  }

  return {
    subject: 'Your FlyFairly login link expires in 15 minutes',
    text: `Go to ${link}`,
    html: `<p>Go to <a href="${link}">${link}</a>.</p>`
  }
}

module.exports = emailContent;
