let json = document.getElementById('GroupData').value;
let data = JSON.parse(json);
let isSystem = data.IsSystem;
data.ShowGroupTitle = !data.HideGroupTitle;
let groupEditor;
Alpine.data('Settings', () => ({
    customInit(){ 
        groupEditor = this; 
        setTimeout(() => {
            this.updatePreview();
        }, 0);
    },
    model: data, 
    isItemSaved: false,
    NewEdit:false,
    <%- include('../generic-alpine-editor.js') %>
    cancel(){
        if(this.isDisabled()) return;
        <% if(isSystem) { %>
            this.cancelGoto('/settings/system/groups');
        <% } else { %>
            this.cancelGoto('/settings/groups');
        <% } %>
    },
    save() {
        if(this.isDisabled()) return;
        
        this.Saved = true;

        if(!this.validate())
            return false;

        this.model.HideGroupTitle = !this.model.ShowGroupTitle;
            
        const options = {
            method: 'POST',
            body: JSON.stringify(this.model),
            headers: {
                'Content-Type': 'application/json'
            }
        }
        let url = (isSystem ? '/settings/system/groups/' : '/settings/groups/') + this.model.Uid;
        this.setSaving(true);
        fetch(url, options).then(async (res)=>{
            if(!res.ok)
                throw await res.text();
            this.markClean();                
            window.location = isSystem ? '/settings/system/groups' : '/settings/groups';
        }).catch(err => {
            this.setSaving(false);
            toast(err || 'Failed to save', false);
        });
        return true;
    }, 

    remove(item) {
        if(this.isDisabled()) return;
        confirmPrompt(`Are you sure you want to delete the item "${item.Name}"?`).then(() => 
        {
            this.model.Items = this.model.Items.filter(x => x.Uid !== item.Uid);
            this.updatePreview();
        }).catch(err => {});
    },

    updatePreview() {
        if(themeInstance?.initPreview){
            themeInstance.initPreview();
            setTimeout(() => themeInstance.initPreview(), 1);
        }
    },
    move(item, up) {
        if(this.isDisabled()) return;
        let index = this.model.Items.indexOf(item);
        if(up && index < 1)
            return;
        if(!up && index >= this.model.Items.length - 1)
            return;
        let dest = index + (up ? -1 : 1);
        let temp = this.model.Items[index];
        this.model.Items[index] = this.model.Items[dest];
        this.model.Items[dest] = temp;
        this.updatePreview();
    },

    // item editor stuff
    focusItem(){
        setTimeout(()=> { document.querySelector('.group-item-editor .content').querySelector('input, select').focus();}, 250);
    },
    addItem() {
        if(this.isDisabled()) return;
        itemEditor.addItem();
    },
    editItem(item) {
        if(this.isDisabled()) return;
        if(this.isDisabled()) return;
        
        itemEditor.editItem(item.Uid);
    },


    // copy item stuff
    copyItem: null,
    modalGroup: null,
    copy(item) {
        this.modalGroup = null;
        this.copyItem = item;
    },
    modalCopy(){
        if(!this.modalGroup)
            return; // they need to pick one

        if(this.modalGroup === 'THIS_GROUP'){
            // special case, copying to this group
            let newItem = JSON.parse(JSON.stringify(this.copyItem));
            this.model.Items.push(newItem);
            this.updatePreview();
            toast('Copied item', true);
            this.copyItem = null;   
            return;
        }
        const options = {
            method: 'POST',
            body: JSON.stringify(this.copyItem),
            headers: {
                'Content-Type': 'application/json'
            }
        }
        fetch(`/settings/groups/copy-item/${this.modalGroup}`, options).then(async (res) => {
            if(!res.ok)
                throw await res.text();
            toast('Copied item', true);
            this.copyItem = null;   
        }).catch(err => {
            toast(err || 'Failed to copy', false);
        });
    },
    modalCancel() {
        this.copyItem = null;
    },
}))