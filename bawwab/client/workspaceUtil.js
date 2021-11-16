export async function copy(workspace) {
    if (!workspace) {
        workspace = this.workspace;
    }
    const newws = await this.workspaces.copy(workspace);
    newws.metadata.name = this.$t('g.copyname', {name: newws.metadata.name});
    await this.workspaces.update(newws);
    /* then go there */
    await this.$router.push({name: 'workspace', params: {wsid: newws.metadata._id}})
}
