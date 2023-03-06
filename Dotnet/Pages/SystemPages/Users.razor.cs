using Fenrus.Components;
using Fenrus.Components.SideEditors;
using Fenrus.Models;
using Fenrus.Services;

namespace Fenrus.Pages;

/// <summary>
/// Users page
/// </summary>
public partial class Users: CommonPage<User>
{
    /// <summary>
    /// Gets or sets the items 
    /// </summary>
    public List<User> Items { get; set; } = new();
    
    /// <summary>
    /// Gets or sets the table instance
    /// </summary>
    private FenrusTable<User> Table { get; set; }

    
    private string lblTitle, lblDescription, lblAllowRegistrations, lblAdmin, lblUsername, lblFullName;
    
    /// <summary>
    /// Called after the user has been fetched
    /// </summary>
    protected override async Task PostGotUser()
    {
        lblUsername = Translater.Instant("Pages.Users.Columns.Username");
        lblFullName = Translater.Instant("Pages.Users.Columns.FullName");
        lblTitle = Translater.Instant("Pages.Users.Title");
        lblDescription = Translater.Instant("Pages.Users.Labels.PageDescription");
        lblAllowRegistrations = Translater.Instant("Pages.Users.Fields.AllowRegistrations");
        lblAdmin = Translater.Instant("Pages.Users.Columns.Admin");
        Items = new UserService().GetAll();
    }

    /// <summary>
    /// Gets or sets if registrations are allowed
    /// </summary>
    private bool AllowRegistrations
    {
        get => SystemSettings.AllowRegister;
        set
        {
            if (value == SystemSettings.AllowRegister)
                return;
            SystemSettings.AllowRegister = value;
            SystemSettings.Save();
            ToastService.ShowSuccess(Translater.Instant("Labels.UpdatedSuccessfully"));
        }
    }
    
    /// <summary>
    /// Checks if the item is the same as the operating user
    /// </summary>
    /// <param name="item">the item to check</param>
    /// <returns>if the item is the same as the operating user</returns>
    private bool IsSelf(Models.User item)
        => item.Uid == Settings.Uid;

    /// <summary>
    /// Updates a users admin status
    /// </summary>
    /// <param name="user">the user being updated</param>
    /// <param name="isAdmin">whether or not they are now an admin</param>
    private void AdminUpdated(User user, bool isAdmin)
    {
        if (IsSelf(user))
            return;
        if (user.IsAdmin != isAdmin)
        {
            user.IsAdmin = isAdmin;
            new UserService().Update(user);
        }
    }

    
    /// <summary>
    /// Add a suer
    /// </summary>
    private async Task Add()
    {
        var result = await Popup.OpenEditor<UserEditor, User>(Translater, null);
        if (result.Success == false)
            return;
        Items.Add(result.Data);
        Items = Items.OrderBy(x => x.Name).ToList();
        Table.SetData(Items);
    }
    /// <summary>
    /// Edits a suer
    /// </summary>
    /// <param name="user">the user to edit</param>
    private async Task Edit(User user)
    {
        if (user.Uid == Settings.Uid)
        {
            ToastService.ShowWarning(Translater.Instant("Pages.Users.Message.CannotEditSelf"));
            return;
        }

        var result = await Popup.OpenEditor<UserEditor, User>(Translater, user);
        if (result.Success == false)
            return;
        user.Name = result.Data.Name;
        user.Username = result.Data.Username;
        user.Password = result.Data.Password;
        user.Email = result.Data.Email;
        user.IsAdmin = result.Data.IsAdmin;
        Items = Items.OrderBy(x => x.Name).ToList();
        Table.SetData(Items);
    }

    protected override bool DoDelete(User item)
    {
        if (item.Uid == Settings.Uid)
            return false; // cannot delete self
        var service = new UserService();
        service.Delete(item.Uid);
        Items = Items.Where(x => x.Uid != item.Uid).ToList();
        Table.SetData(Items);
        return true;
    }
}