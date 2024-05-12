module.exports = async ({ core, exec, context, fetch }, token) => {
  try {
    const { Octokit } = await import("@octokit/core");
    const octokit = new Octokit({
      request: { fetch: fetch },
      auth: process.env.APP_PRIVATE_KEY,
    });

    const checkoutPageDir = "gh-pages"
    const branchName = "gh-pages"
    const helm = {
      owner: process.env.OWNER,
      repo: process.env.REPO,
      ref: process.env.REF,
      charts: JSON.parse(process.env.CHARTS)
    }

    try {
      await exec.exec('git', ['remote', '-v'], { cwd: checkoutPageDir })
      await exec.exec('git', ['status'], { cwd: checkoutPageDir })
      await exec.exec('git', ['config', '--local', 'credential.helper', 'store --file ~/.git-credentials'], { cwd: checkoutPageDir })
      await exec.exec('echo', [`https://Siemmetric:${process.env.APP_PRIVATE_KEY}@github.com`, '>>', '~/.git-credentials'], { cwd: checkoutPageDir })
      await exec.exec('git', ['config', '--local', 'user.name', 'Siemmetric'], { cwd: checkoutPageDir })
      await exec.exec('git', ['config', '--local', 'user.email', 'siemmetric@gmail.com'], { cwd: checkoutPageDir })

      await exec.exec('helm', ['repo', 'index', '.'], { cwd: checkoutPageDir })
      await exec.exec('git', ['add', 'index.yaml'], { cwd: checkoutPageDir })

      await exec.exec('git', ['status'], { cwd: checkoutPageDir })
      await exec.exec('git', ['commit', '-m', `Publish helm chart with version ${helm.ref} to ${context.payload.repository.owner.login}/${context.payload.repository.name}`, '--verbose'], { cwd: checkoutPageDir })
      await exec.exec('git', ['push', 'origin', branchName, '--verbose'], { cwd: checkoutPageDir })
    } catch (error) {
      return core.setFailed(`Unable to push ${checkoutPageDir}/${helm.charts.destination} to Siemmetric/charts@${branchName}\nError: ${error}`)
    }
  } catch (error) {
    console.error('Error importing Octokit modules:', error);
    process.exit(1); // Exit the process with a non-zero status code
  }
}
