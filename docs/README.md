# Jobs

There are 2 jobs running: <br>
**SyncBackJob** - syncing photos for new users from the moment of registering to the service. The most amount of images;<br>
**SyncForward** - After SyncBack Job is done, SyncForward Job syncs newly uploaded images by user if any.

![SyncBackJob](./SyncBackJobSequenceDiagram.png)
![SyncForwardJob](./SyncForwardJobSequenceDiagram.png)