
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1">

    <title>Honeybee Account Recovery</title>
</head>

<body style="max-width:440px;margin:60px auto;
             font-family:Arial,sans-serif;padding:20px;">

    <h1>Super Admin Recovery</h1>

    <p>
        Enter your recovery token and the credentials
        for the replacement administrator.
    </p>

    @if ($errors->any())
        <div role="alert" style="color:#b91c1c;">
            <ul>
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST"
          action="{{ route('admin.recovery.store') }}">

        @csrf

        <p>
            <label for="token">Recovery token</label><br>
            <input id="token" name="token"
                   type="password" required
                   autocomplete="off"
                   style="width:100%;">
        </p>

        <p>
            <label for="name">Full name</label><br>
            <input id="name" name="name"
                   value="{{ old('name') }}"
                   required style="width:100%;">
        </p>

        <p>
            <label for="email">Email address</label><br>
            <input id="email" name="email"
                   type="email"
                   value="{{ old('email') }}"
                   required style="width:100%;">
        </p>

        <p>
            <label for="password">New password</label><br>
            <input id="password" name="password"
                   type="password" required
                   autocomplete="new-password"
                   style="width:100%;">
        </p>

        <p>
            <label for="password_confirmation">
                Confirm password
            </label><br>
            <input id="password_confirmation"
                   name="password_confirmation"
                   type="password" required
                   autocomplete="new-password"
                   style="width:100%;">
        </p>

        <button type="submit">
            Create replacement administrator
        </button>
    </form>
</body>
</html>
