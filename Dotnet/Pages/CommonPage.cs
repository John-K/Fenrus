using Blazored.Toast.Services;
using Fenrus.Components.Dialogs;
using Fenrus.Models;
using Humanizer;
using Microsoft.AspNetCore.Components;

namespace Fenrus.Pages;

/// <summary>
/// Common page
/// </summary>
/// <typeparam name="T">the page this item lists</typeparam>
public abstract class CommonPage<T>: UserPage
where T : IModal
{
    protected string GetTypeName()
        => typeof(T).Name.Humanize();
    protected string GetTypeNameRoute()
        => typeof(T).Name.Pluralize().Underscore().Hyphenate();

    /// <summary>
    /// Gets or sets the toast service
    /// </summary>
    [Inject] protected IToastService ToastService { get; set; }

    /// <summary>
    /// Gets or sets if this is a system page
    /// </summary>
    [Parameter] public bool IsSystem { get; set; }
    
    /// <summary>
    /// Removes an item, prompting for confirmation
    /// </summary>
    /// <param name="item">The item being removed</param>
    protected async Task Remove(T item)
    {
        string typeName = GetTypeName();
        if (await Confirm.Show(Translater.Instant("Labels.Delete"), Translater.Instant("Labels.DeleteItem", new { typeName, name = item.Name})) == false)
            return;
        if (DoDelete(item))
            ToastService.ShowSuccess(Translater.Instant("Labels.DeletedItem", new { typeName, name = item.Name}));
    }

    /// <summary>
    /// Actually performs the deletion after confirmation has been received
    /// </summary>
    /// <param name="item">the item being deleted</param>
    /// <returns>if the deletion was successful</returns>
    protected virtual bool DoDelete(T item)
    {
        DbHelper.Delete<T>(item.Uid);
        return true;
    }

    protected virtual async Task Add()
    {
        Router.NavigateTo($"/settings/{GetTypeNameRoute()}/" + Guid.Empty + 
                          (IsSystem ? "isSystem=true" : string.Empty));   
    }

    protected virtual async Task Move(T item, bool up)
    {
        // if (item == null)
        //     return Task.CompletedTask;
        // var index = Items.IndexOf(item);
        // if (index < 0)
        //     return Task.CompletedTask;
        // if (up && index < 1)
        //     return Task.CompletedTask;
        // if (up == false && index >= Items.Count - 1)
        //     return Task.CompletedTask;
        // int dest = index + (up ? -1 : 1);
        //
        // Items[index] = Items[dest];
        // Items[dest] = item;
    }
}